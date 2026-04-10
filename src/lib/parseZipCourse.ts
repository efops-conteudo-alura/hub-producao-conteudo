import JSZip from "jszip";
import type { Course, Exercise } from "@/types/course";

const KIND_MAP: Record<string, string> = {
  "sin respuesta del estudiante": "TEXT_CONTENT",
  "sem resposta do aluno": "TEXT_CONTENT",
  "selección única": "SINGLE_CHOICE",
  "selecao unica": "SINGLE_CHOICE",
  "seleção única": "SINGLE_CHOICE",
  "selección múltiple": "MULTIPLE_CHOICE",
  "selecao multipla": "MULTIPLE_CHOICE",
  "seleção múltipla": "MULTIPLE_CHOICE",
};

function normalizeKindStr(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function mapKind(raw: string): string {
  return KIND_MAP[normalizeKindStr(raw)] ?? "TEXT_CONTENT";
}

type Section =
  | "none"
  | "title"
  | "text"
  | `alt-${number}-text`
  | `alt-${number}-opinion`
  | "sampleAnswer";

interface AltData {
  text: string;
  opinion: string;
  correct: boolean;
}

/**
 * Parseia um arquivo .md de atividade estruturada.
 * Retorna null se o arquivo não tiver o cabeçalho "Tipo de tarea" (transcrição de vídeo).
 */
export function parseMdActivity(content: string): Exercise | null {
  const lines = content.split(/\r?\n/);

  const firstLine = lines[0]?.trim() ?? "";
  const kindMatch = firstLine.match(/^(?:Tipo de tarea|Task Kind)\s+(.+)$/i);
  if (!kindMatch) return null;

  const kind = mapKind(kindMatch[1]);

  let section: Section = "none";
  let currentAltIndex = -1;

  let title = "";
  let text = "";
  let sampleAnswer = "";
  const alts: AltData[] = [];

  const accumulators: Record<string, string[]> = {
    title: [],
    text: [],
    sampleAnswer: [],
  };

  function flush(sec: Section) {
    if (sec === "title") {
      title = accumulators.title.join("\n").trim();
      accumulators.title = [];
    } else if (sec === "text") {
      text = accumulators.text.join("\n").trim();
      accumulators.text = [];
    } else if (sec === "sampleAnswer") {
      sampleAnswer = accumulators.sampleAnswer.join("\n").trim();
      accumulators.sampleAnswer = [];
    } else if (sec.startsWith("alt-")) {
      const match = sec.match(/^alt-(\d+)-(text|opinion)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        const part = match[2] as "text" | "opinion";
        while (alts.length <= idx) alts.push({ text: "", opinion: "", correct: false });
        const accumulated = (accumulators[sec] ?? []).join("\n").trim();
        alts[idx][part] = accumulated;
        accumulators[sec] = [];
      }
    }
  }

  function switchSection(newSection: Section) {
    flush(section);
    section = newSection;
    if (!(section in accumulators)) {
      accumulators[section] = [];
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Section header detection
    if (/^T[ií]tul[eo]?$|^Title$/i.test(trimmed)) {
      switchSection("title");
      continue;
    }

    if (/^(?:Content|Contenido|Enunciado)$/i.test(trimmed)) {
      switchSection("text");
      continue;
    }

    const altTextMatch = trimmed.match(/^Alternativa\s+(\d+)$/i);
    if (altTextMatch) {
      const idx = parseInt(altTextMatch[1], 10) - 1;
      currentAltIndex = idx;
      switchSection(`alt-${idx}-text`);
      continue;
    }

    const altOpinionMatch = trimmed.match(/^Opini[oó]n\s+(\d+)$|^Opinion\s+(\d+)$/i);
    if (altOpinionMatch) {
      const num = altOpinionMatch[1] ?? altOpinionMatch[2];
      const idx = parseInt(num, 10) - 1;
      currentAltIndex = idx;
      switchSection(`alt-${idx}-opinion`);
      continue;
    }

    const correctoMatch = trimmed.match(/^Correcto:\s*(.+)$/i);
    if (correctoMatch) {
      const val = correctoMatch[1].trim().toLowerCase();
      const isCorrect = val === "sí" || val === "si" || val === "yes" || val === "sim" || val === "true";
      if (currentAltIndex >= 0) {
        while (alts.length <= currentAltIndex) alts.push({ text: "", opinion: "", correct: false });
        alts[currentAltIndex].correct = isCorrect;
      }
      continue;
    }

    // "Opinión" / "Opinion" without number → sampleAnswer (for TEXT_CONTENT at end)
    if (/^Opini[oó]n$|^Opinion$/i.test(trimmed)) {
      switchSection("sampleAnswer");
      continue;
    }

    // Accumulate line into current section
    if (section !== "none") {
      const key = section as string;
      if (!(key in accumulators)) accumulators[key] = [];
      accumulators[key].push(line);
    }
  }

  flush(section);

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

/**
 * Parseia um arquivo ZIP com a estrutura de traduções de curso:
 * <courseId>/<N - Aula>/<N.M-Atividade.md>
 *
 * O courseId é extraído automaticamente do nome da pasta raiz do ZIP.
 */
export async function parseZipCourse(file: File): Promise<Course> {
  const zip = await JSZip.loadAsync(file);

  const mdEntries = Object.values(zip.files).filter(
    (f) => !f.dir && f.name.toLowerCase().endsWith(".md")
  );

  if (mdEntries.length === 0) {
    throw new Error("O ZIP não contém arquivos .md.");
  }

  // Extrair courseId da pasta raiz (primeira parte do path)
  const firstPath = mdEntries[0].name;
  const courseId = firstPath.split("/")[0] ?? file.name.replace(/\.zip$/i, "");

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

    const lessonFolder = parts[parts.length - 2];
    const fileName = parts[parts.length - 1];

    // Extrair número da aula: "1 - O_Workspace" → 1
    const lessonNumMatch = lessonFolder.match(/^(\d+)/);
    if (!lessonNumMatch) continue;
    const lessonNumber = parseInt(lessonNumMatch[1], 10);
    const lessonTitle = lessonFolder.replace(/^\d+\s*-\s*/, "").replace(/_/g, " ");

    // Extrair ordem do arquivo: "1.2-Titulo.md" → 1.2
    const fileOrderMatch = fileName.match(/^([\d.]+)/);
    const fileOrder = fileOrderMatch ? parseFloat(fileOrderMatch[1]) : 999;

    const content = await entry.async("text");
    const exercise = parseMdActivity(content);
    if (!exercise) continue; // transcrição de vídeo → ignorar

    if (!lessonsMap.has(lessonNumber)) {
      lessonsMap.set(lessonNumber, {
        lessonNumber,
        title: lessonTitle,
        exercises: [],
      });
    }
    lessonsMap.get(lessonNumber)!.exercises.push({ order: fileOrder, exercise });
  }

  if (lessonsMap.size === 0) {
    throw new Error(
      "Nenhuma atividade válida encontrada no ZIP (todos os arquivos são transcrições de vídeo ou o formato é inválido)."
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
