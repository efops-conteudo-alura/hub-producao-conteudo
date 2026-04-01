"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Alternative, Exercise, Lesson } from "@/types/course";

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        pre: ({ children }) => <>{children}</>,
        code: ({ children, className }) => {
          const language = className?.replace("language-", "");
          if (language) {
            return (
              <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{ borderRadius: "0.5rem", fontSize: "0.75rem", margin: "4px 0" }}
                wrapLongLines
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          }
          // Bloco sem linguagem especificada
          if (String(children).includes("\n")) {
            return (
              <pre className="bg-[#282c34] text-[#abb2bf] rounded-lg px-3 py-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto my-1 leading-relaxed">
                <code>{children}</code>
              </pre>
            );
          }
          // Código inline
          return (
            <code className="bg-muted border border-border/40 rounded px-1 py-0.5 text-xs font-mono">
              {children}
            </code>
          );
        },
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        h1: ({ children }) => <h1 className="text-xl font-bold mt-2 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mt-2 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-border pl-3 text-muted-foreground my-1">{children}</blockquote>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar"
      className="shrink-0 p-0.5 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors"
    >
      {copied
        ? <Check size={12} className="text-green-500" />
        : <Copy size={12} />}
    </button>
  );
}

function getActivityLabel(kind: string, dataTag?: string): string {
  if (kind === "SINGLE_CHOICE") {
    if (dataTag === "PRACTICE_CLASS_CONTENT") return "Única escolha sobre o conteúdo da aula";
    return "Única escolha";
  }
  if (kind === "MULTIPLE_CHOICE") return "Múltipla escolha";
  if (kind === "HQ_EXPLANATION") {
    if (dataTag === "SETUP_EXPLANATION") return "Preparando o ambiente";
    if (dataTag === "COMPLEMENTARY_INFORMATION") return "Para saber mais";
    if (dataTag === "WHAT_WE_LEARNED") return "O que aprendemos?";
    return "Explicação";
  }
  if (kind === "TEXT_CONTENT") {
    if (dataTag === "DO_AFTER_ME") return "Faça como eu fiz na aula";
    if (dataTag === "VARIATION") return "Analogamente";
    if (dataTag === "CHALLENGE") return "Desafio";
    if (dataTag === "SHOULD_NOT_EXIST") return "Criar outro projeto, análogo à aula";
    return "Sem Resposta do Aluno";
  }
  return kind;
}

type Props = {
  lesson: Lesson;
  exercise: Exercise;
  selectable?: boolean;
  onToggle?: (lesson: Lesson, exercise: Exercise) => void;
  readOnly?: boolean;
  editable?: boolean;
  isEditing?: boolean;
  onEditToggle?: (exerciseId: string) => void;
  onRestore?: (lessonNumber: number, exercise: Exercise) => void;
  onRemove?: (lessonNumber: number, exerciseId: string) => void;
  comment?: string;
  onCommentChange?: (lessonNumber: number, exerciseId: string, comment: string) => void;
  onExerciseChange?: (lessonNumber: number, exerciseId: string, changes: Partial<Exercise>) => void;
  onAlternativeChange?: (lessonNumber: number, exerciseId: string, altIndex: number, changes: Partial<Alternative>) => void;
  originalExercise?: Exercise;
  copyable?: boolean;
};

export function ExerciseCard({
  lesson,
  exercise,
  selectable = false,
  onToggle,
  readOnly = false,
  editable = false,
  isEditing = false,
  onEditToggle,
  onRestore,
  onRemove,
  comment,
  onCommentChange,
  onExerciseChange,
  onAlternativeChange,
  originalExercise,
  copyable = false,
}: Props) {
  const showEditableInputs = editable || isEditing;
  const origSample = originalExercise?.sampleAnswer;
  const sampleChanged = origSample !== undefined && origSample !== exercise.sampleAnswer;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${
      isEditing
        ? "bg-muted/60 border-primary/30"
        : "bg-muted/30 border-border"
    }`}>
      {/* Badge de tipo de atividade */}
      {exercise.kind && (
        <span className="text-xs font-medium text-muted-foreground/80 bg-muted border border-border/60 rounded px-2 py-0.5 self-start">
          {getActivityLabel(exercise.kind, exercise.dataTag)}
        </span>
      )}

      {/* Título e enunciado — modo seleção */}
      {selectable && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={exercise.isSelected ?? false}
            onChange={() => onToggle?.(lesson, exercise)}
            className="mt-1 w-4 h-4 shrink-0"
          />
          <div className="flex-1 flex flex-col gap-1">
            <p className="font-semibold text-foreground">{exercise.title}</p>
            <div className="text-sm text-foreground/70">
              <Markdown>{exercise.text}</Markdown>
            </div>
          </div>
        </label>
      )}

      {/* Título e enunciado — modo edição (inputs) */}
      {!selectable && showEditableInputs && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Título</label>
          <textarea
            rows={3}
            value={exercise.title}
            onChange={(e) =>
              onExerciseChange?.(lesson.lessonNumber, exercise.id, { title: e.target.value })
            }
            className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:border-primary resize-none"
          />
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Enunciado</label>
          <textarea
            rows={9}
            value={exercise.text}
            onChange={(e) =>
              onExerciseChange?.(lesson.lessonNumber, exercise.id, { text: e.target.value })
            }
            className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground/70 focus:outline-none focus:border-primary resize-none"
          />
        </div>
      )}

      {/* Título e enunciado — modo leitura (com diff opcional) */}
      {!selectable && !showEditableInputs && (
        <div className="flex flex-col gap-1">
          {originalExercise && originalExercise.title !== exercise.title && (
            <p className="text-xs line-through text-destructive/70">{originalExercise.title}</p>
          )}
          <div className="flex items-start gap-1">
            <p className={`font-semibold flex-1 ${originalExercise && originalExercise.title !== exercise.title ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
              {exercise.title}
            </p>
            {copyable && <CopyButton text={exercise.title} />}
          </div>
          {originalExercise && originalExercise.text !== exercise.text && (
            <div className="text-xs line-through text-destructive/70 mt-1">
              <Markdown>{originalExercise.text}</Markdown>
            </div>
          )}
          <div className="flex items-start gap-1 mt-1">
            <div className={`text-sm flex-1 ${originalExercise && originalExercise.text !== exercise.text ? "text-green-600 dark:text-green-400" : "text-foreground/70"}`}>
              <Markdown>{exercise.text}</Markdown>
            </div>
            {copyable && <CopyButton text={exercise.text} />}
          </div>
        </div>
      )}

      {/* Alternativas */}
      <div className="flex flex-col gap-1 pl-1">
        {exercise.alternatives.map((alt, i) => {
          const origAlt = originalExercise?.alternatives[i];
          const textChanged = origAlt && origAlt.text !== alt.text;
          const opinionChanged = origAlt && origAlt.opinion !== alt.opinion;
          const correctChanged = origAlt && origAlt.correct !== alt.correct;

          if (showEditableInputs) {
            const isMultiple = exercise.kind === "MULTIPLE_CHOICE";
            return (
              <div
                key={i}
                className="flex flex-col gap-1 py-2 px-2 rounded-lg border border-border/50 bg-background/50"
              >
                <div className="flex items-center gap-2">
                  <input
                    type={isMultiple ? "checkbox" : "radio"}
                    name={isMultiple ? undefined : `correct-${exercise.id}`}
                    checked={alt.correct}
                    onChange={() =>
                      onAlternativeChange?.(
                        lesson.lessonNumber,
                        exercise.id,
                        i,
                        { correct: isMultiple ? !alt.correct : true }
                      )
                    }
                    className="shrink-0"
                  />
                  <input
                    type="text"
                    value={alt.text}
                    onChange={(e) =>
                      onAlternativeChange?.(lesson.lessonNumber, exercise.id, i, { text: e.target.value })
                    }
                    className={`flex-1 rounded bg-background border px-2 py-1 text-sm focus:outline-none focus:border-primary ${
                      alt.correct
                        ? "border-blue-400/40 text-blue-400"
                        : "border-border text-foreground/70"
                    }`}
                  />
                  {alt.correct && (
                    <span className="text-xs font-semibold text-blue-400 shrink-0">correta</span>
                  )}
                </div>
                <input
                  type="text"
                  value={alt.opinion}
                  onChange={(e) =>
                    onAlternativeChange?.(lesson.lessonNumber, exercise.id, i, { opinion: e.target.value })
                  }
                  placeholder="Feedback da alternativa..."
                  className="rounded bg-background border border-border/50 px-2 py-1 text-xs text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
                />
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`flex flex-col gap-0.5 text-sm py-1 px-2 rounded-lg ${
                alt.correct ? "bg-blue-400/10 text-blue-400" : "text-foreground/60"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">{alt.correct ? "✓" : "○"}</span>
                <div className="flex-1">
                  {textChanged && (
                    <div className="text-xs line-through text-destructive/70">
                      <Markdown>{origAlt!.text}</Markdown>
                    </div>
                  )}
                  <div className={textChanged ? "text-green-600 dark:text-green-400" : ""}>
                    <Markdown>{alt.text}</Markdown>
                  </div>
                  {correctChanged && (
                    <span className="ml-2 text-xs text-yellow-500">
                      {alt.correct
                        ? "(marcada como correta pelo instrutor)"
                        : "(desmarcada pelo instrutor)"}
                    </span>
                  )}
                </div>
                {copyable && <CopyButton text={alt.text} />}
                {alt.correct && (
                  <span className="text-xs font-semibold text-blue-400 shrink-0">
                    correta
                  </span>
                )}
              </div>
              {opinionChanged && (
                <p className="text-xs line-through text-destructive/70 pl-5">{origAlt!.opinion}</p>
              )}
              {alt.opinion && (
                <div className="flex items-center gap-1 pl-5">
                  <p className={`text-xs flex-1 ${opinionChanged ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>{alt.opinion}</p>
                  {copyable && <CopyButton text={alt.opinion} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resposta de exemplo (sampleAnswer) — atividades TEXT_CONTENT */}
      {exercise.sampleAnswer !== undefined && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Resposta de exemplo</label>
          {showEditableInputs ? (
            <textarea
              rows={9}
              value={exercise.sampleAnswer}
              onChange={(e) =>
                onExerciseChange?.(lesson.lessonNumber, exercise.id, { sampleAnswer: e.target.value })
              }
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground/70 focus:outline-none focus:border-primary resize-none"
            />
          ) : (
            <div className="flex flex-col gap-0.5">
              {sampleChanged && (
                <div className="text-xs line-through text-destructive/70">
                  <Markdown>{origSample!}</Markdown>
                </div>
              )}
              <div className="flex items-start gap-1">
                <div className={`text-sm text-foreground/70 bg-muted/40 rounded-lg px-3 py-2 border border-border/50 flex-1 ${sampleChanged ? "text-green-600 dark:text-green-400" : ""}`}>
                  <Markdown>{exercise.sampleAnswer!}</Markdown>
                </div>
                {copyable && <CopyButton text={exercise.sampleAnswer!} />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comentário — editável (instrutor em edição) */}
      {onCommentChange !== undefined && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Comentário opcional</label>
          <textarea
            rows={2}
            disabled={readOnly}
            value={comment ?? ""}
            onChange={(e) =>
              onCommentChange(lesson.lessonNumber, exercise.id, e.target.value)
            }
            placeholder={readOnly ? "" : "Adicione uma observação..."}
            className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Comentário do instrutor + diff (modo leitura, para coordenador) */}
      {!showEditableInputs && !onCommentChange && (
        <>
          {originalExercise && !originalExercise.comment && exercise.comment && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-blue-400/70">Comentário adicionado pelo instrutor</label>
              <div className="flex items-start gap-1">
                <p className="text-sm text-foreground/70 bg-primary/5 rounded-lg px-3 py-2 border border-primary/20 flex-1">
                  {exercise.comment}
                </p>
                {copyable && <CopyButton text={exercise.comment} />}
              </div>
            </div>
          )}
          {originalExercise && originalExercise.comment && originalExercise.comment !== exercise.comment && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Comentário (editado pelo instrutor)</label>
              <p className="text-xs line-through text-destructive/70 bg-muted/50 rounded px-3 py-1">
                {originalExercise.comment}
              </p>
              <div className="flex items-start gap-1">
                <p className="text-sm text-foreground/70 bg-muted/50 rounded-lg px-3 py-2 border border-border/50 flex-1">
                  {exercise.comment}
                </p>
                {copyable && exercise.comment && <CopyButton text={exercise.comment} />}
              </div>
            </div>
          )}
          {!originalExercise && exercise.comment && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Comentário do instrutor</label>
              <div className="flex items-start gap-1">
                <p className="text-sm text-foreground/70 bg-muted/50 rounded-lg px-3 py-2 border border-border/50 flex-1">
                  {exercise.comment}
                </p>
                {copyable && <CopyButton text={exercise.comment} />}
              </div>
            </div>
          )}
        </>
      )}

      {/* Botões de ação do coordenador */}
      {(onEditToggle || onRemove) && (
        <div className="flex justify-end gap-2 pt-1">
          {onRemove && (
            <button
              onClick={() => onRemove(lesson.lessonNumber, exercise.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive/70 hover:text-destructive hover:bg-destructive/20 transition-colors"
            >
              Excluir
            </button>
          )}
          {onEditToggle && (
            <button
              onClick={() => onEditToggle(exercise.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                isEditing
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {isEditing ? "✓ Concluir edição" : "Editar"}
            </button>
          )}
        </div>
      )}

      {/* Botão restaurar (exercício não selecionado) */}
      {onRestore && (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => onRestore(lesson.lessonNumber, exercise)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors"
          >
            + Incluir na seleção
          </button>
        </div>
      )}
    </div>
  );
}
