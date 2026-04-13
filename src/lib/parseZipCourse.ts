import JSZip from "jszip";
import type { Course, Exercise } from "@/types/course";

// ─── Encoding helpers ────────────────────────────────────────────────────────

/**
 * Tenta corrigir mojibake: conteúdo UTF-8 lido como Latin-1.
 * Se o string tiver caracteres Latin-1 na faixa 0xC0-0xFF seguidos de padrões
 * compatíveis com sequências UTF-8, re-decodifica como UTF-8.
 */
function fixMojibake(str: string): string {
  if (!/[\xC0-\xFF]/.test(str)) return str;
  try {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded.includes("\uFFFD") ? str : decoded;
  } catch {
    return str;
  }
}

// ─── Kind mapping ────────────────────────────────────────────────────────────

const KIND_MAP: Record<string, string> = {
  // Sem interação
  "sin respuesta del estudiante": "TEXT_CONTENT",
  "sem resposta do aluno": "TEXT_CONTENT",
  "explicacion": "TEXT_CONTENT",
  "explicacao": "TEXT_CONTENT",
  "para saber mas": "TEXT_CONTENT",
  // Seleção única
  "seleccion unica": "SINGLE_CHOICE",
  "selecao unica": "SINGLE_CHOICE",
  // Seleção múltipla
  "seleccion multiple": "MULTIPLE_CHOICE",
  "selecao multipla": "MULTIPLE_CHOICE",
};

function normalizeKindStr(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacríticos
    .toLowerCase()
    .trim();
}

function mapKind(raw: string): string {
  return KIND_MAP[normalizeKindStr(raw)] ?? "TEXT_CONTENT";
}

// ─── Section header detection ─────────────────────────────────────────────────

/**
 * Normaliza uma linha para comparação de cabeçalho de seção:
 * remove diacríticos, espaços extras, dois-pontos finais e converte para minúsculas.
 */
function normalizeHeaderLine(line: string): string {
  return line
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/:$/, "")
    .trim()
    .toLowerCase();
}

// ─── MD Activity Parser ───────────────────────────────────────────────────────

interface AltData {
  text: string;
  opinion: string;
  correct: boolean;
}

type Section =
  | "none"
  | "title"
  | "text"
  | `alt-${number}-text`
  | `alt-${number}-opinion`
  | "sampleAnswer";

/**
 * Parseia um arquivo .md de atividade estruturada.
 * Retorna null se não tiver o cabeçalho "Tipo de tarea" (transcrição de vídeo).
 */
export function parseMdActivity(rawContent: string): Exercise | null {
  const content = fixMojibake(rawContent);
  const lines = content.split(/\r?\n/);

  // Primeira linha: "Tipo de tarea[:]? <tipo>" ou "Task Kind[:]? <tipo>"
  const firstLine = lines[0]?.trim() ?? "";
  const kindMatch = firstLine.match(
    /^(?:Tipo de tarea|Task Kind):?\s+(.+)$/i
  );
  if (!kindMatch) return null;

  const kind = mapKind(kindMatch[1]);

  let section: Section = "none";
  let currentAltIndex = -1;
  const accumulators: Record<string, string[]> = {};

  function getAcc(key: string): string[] {
    if (!accumulators[key]) accumulators[key] = [];
    return accumulators[key];
  }

  function flush() {
    // noop — we accumulate until end
  }
  void flush;

  const alts: AltData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const normalized = normalizeHeaderLine(trimmed);

    // ── Detectar cabeçalhos de seção ──────────────────────────────────────

    // Título
    if (normalized === "titulo" || normalized === "title") {
      section = "title";
      continue;
    }

    // Conteúdo / Enunciado
    if (
      normalized === "content" ||
      normalized === "contenido" ||
      normalized === "enunciado"
    ) {
      section = "text";
      continue;
    }

    // Alternativa N
    const altTextMatch = trimmed.match(/^Alternativa\s+(\d+)$/i);
    if (altTextMatch) {
      const idx = parseInt(altTextMatch[1], 10) - 1;
      currentAltIndex = idx;
      section = `alt-${idx}-text`;
      continue;
    }

    // Opinión N / Opinion N
    const altOpinionMatch = trimmed.match(/^Opini[oó]n\s+(\d+)$|^Opinion\s+(\d+)$/i);
    if (altOpinionMatch) {
      const num = altOpinionMatch[1] ?? altOpinionMatch[2];
      const idx = parseInt(num, 10) - 1;
      currentAltIndex = idx;
      section = `alt-${idx}-opinion`;
      continue;
    }

    // Correcto: sí/no
    const correctoMatch = trimmed.match(/^Correcto:\s*(.+)$/i);
    if (correctoMatch) {
      const val = correctoMatch[1].trim().toLowerCase();
      const isCorrect =
        val === "sí" || val === "si" || val === "yes" || val === "sim" || val === "true";
      if (currentAltIndex >= 0) {
        while (alts.length <= currentAltIndex)
          alts.push({ text: "", opinion: "", correct: false });
        alts[currentAltIndex].correct = isCorrect;
      }
      continue;
    }

    // Opinión / Opinion (sem número = sampleAnswer)
    if (/^Opini[oó]n$|^Opinion$/i.test(trimmed)) {
      section = "sampleAnswer";
      continue;
    }

    // ── Acumular conteúdo na seção atual ─────────────────────────────────
    if (section !== "none") {
      getAcc(section).push(line);
    }
  }

  // Montar alternativas
  for (let i = 0; i < alts.length; i++) {
    const textLines = accumulators[`alt-${i}-text`] ?? [];
    const opinionLines = accumulators[`alt-${i}-opinion`] ?? [];
    alts[i].text = textLines.join("\n").trim();
    alts[i].opinion = opinionLines.join("\n").trim();
  }

  // Detectar alternativas que ainda não foram criadas (só o accumulator existe)
  const altKeys = Object.keys(accumulators).filter((k) =>
    k.match(/^alt-\d+-text$/)
  );
  for (const key of altKeys) {
    const idx = parseInt(key.match(/^alt-(\d+)-text$/)![1], 10);
    if (!alts[idx]) {
      alts[idx] = {
        text: (accumulators[key] ?? []).join("\n").trim(),
        opinion: (accumulators[`alt-${idx}-opinion`] ?? []).join("\n").trim(),
        correct: false,
      };
    }
  }

  const title = (accumulators["title"] ?? []).join("\n").trim();
  const text = (accumulators["text"] ?? []).join("\n").trim();
  const sampleAnswer = (accumulators["sampleAnswer"] ?? []).join("\n").trim();

  return {
    id: crypto.randomUUID(),
    title,
    text,
    kind,
    alternatives: alts.map((a) => ({
      text: a.text,
      correct: a.correct,
      opinion: a.opinion,
    })),
    ...(sampleAnswer ? { sampleAnswer } : {}),
  };
}

// ─── ZIP Course Parser ────────────────────────────────────────────────────────

/**
 * Parseia um arquivo ZIP com a estrutura de traduções de curso.
 * O courseId é extraído automaticamente do nome da pasta raiz.
 */
export async function parseZipCourse(file: File): Promise<Course> {
  const zip = await JSZip.loadAsync(file, {
    // Tentar UTF-8 primeiro; se falhar, usar Windows-1252 (comum em ZIPs gerados no Windows)
    decodeFileName: (bytes: string[] | Uint8Array | Buffer) => {
      if (Array.isArray(bytes)) return bytes.join("");
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes as Uint8Array);
      } catch {
        return new TextDecoder("windows-1252").decode(bytes as Uint8Array);
      }
    },
  });

  const mdEntries = Object.values(zip.files).filter(
    (f) => !f.dir && f.name.toLowerCase().endsWith(".md")
  );

  if (mdEntries.length === 0) {
    throw new Error("O ZIP não contém arquivos .md.");
  }

  // courseId = nome da pasta raiz (com fixMojibake para nomes mal codificados)
  const rawCourseId = mdEntries[0].name.split("/")[0] ?? "";
  const courseId = fixMojibake(rawCourseId) || file.name.replace(/\.zip$/i, "");

  interface LessonEntry {
    lessonNumber: number;
    title: string;
    exercises: { order: number; exercise: Exercise }[];
  }
  const lessonsMap = new Map<number, LessonEntry>();

  for (const entry of mdEntries) {
    const parts = entry.name.split("/");
    // Esperado: [courseId, "N - Aula Name", "N.M-Titulo.md"]
    if (parts.length < 3) continue;

    const lessonFolder = fixMojibake(parts[parts.length - 2]);
    const fileName = fixMojibake(parts[parts.length - 1]);

    // Extrair número da aula: "1 - O_Workspace" → 1
    const lessonNumMatch = lessonFolder.match(/^(\d+)/);
    if (!lessonNumMatch) continue;
    const lessonNumber = parseInt(lessonNumMatch[1], 10);
    const lessonTitle = lessonFolder
      .replace(/^\d+\s*[-–]\s*/, "")
      .replace(/_/g, " ")
      .trim();

    // Extrair ordem do arquivo: "1.2-Titulo.md" → 1.2
    const fileOrderMatch = fileName.match(/^([\d.]+)/);
    const fileOrder = fileOrderMatch ? parseFloat(fileOrderMatch[1]) : 999;

    // Ler conteúdo como bytes e decodificar como UTF-8 (mais confiável que "text")
    const uint8 = await entry.async("uint8array");
    const rawContent = new TextDecoder("utf-8").decode(uint8);

    const exercise = parseMdActivity(rawContent);
    if (!exercise) continue; // transcrição de vídeo → ignorar

    if (!lessonsMap.has(lessonNumber)) {
      lessonsMap.set(lessonNumber, { lessonNumber, title: lessonTitle, exercises: [] });
    }
    lessonsMap.get(lessonNumber)!.exercises.push({ order: fileOrder, exercise });
  }

  if (lessonsMap.size === 0) {
    throw new Error(
      "Nenhuma atividade válida encontrada no ZIP (todos os arquivos são transcrições de vídeo ou o formato não foi reconhecido)."
    );
  }

  const lessons = Array.from(lessonsMap.values())
    .sort((a, b) => a.lessonNumber - b.lessonNumber)
    .map((l) => ({
      lessonNumber: l.lessonNumber,
      title: l.title,
      exercises: l.exercises
        .sort((a, b) => a.order - b.order)
        .map((e) => e.exercise),
    }));

  return { courseId, lessons };
}
