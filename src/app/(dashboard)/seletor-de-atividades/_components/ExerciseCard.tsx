"use client";

import type { Alternative, Exercise, Lesson } from "@/types/course";

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
}: Props) {
  const showEditableInputs = editable || isEditing;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${
      isEditing
        ? "bg-muted/60 border-primary/30"
        : "bg-muted/30 border-border"
    }`}>
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
            <p className="text-sm text-foreground/70">{exercise.text}</p>
          </div>
        </label>
      )}

      {/* Título e enunciado — modo edição (inputs) */}
      {!selectable && showEditableInputs && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Título</label>
          <textarea
            rows={1}
            value={exercise.title}
            onChange={(e) =>
              onExerciseChange?.(lesson.lessonNumber, exercise.id, { title: e.target.value })
            }
            className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:border-primary resize-none"
          />
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Enunciado</label>
          <textarea
            rows={3}
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
          <p className={`font-semibold ${originalExercise && originalExercise.title !== exercise.title ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
            {exercise.title}
          </p>
          {originalExercise && originalExercise.text !== exercise.text && (
            <p className="text-xs line-through text-destructive/70 mt-1">{originalExercise.text}</p>
          )}
          <p className={`text-sm mt-1 ${originalExercise && originalExercise.text !== exercise.text ? "text-green-600 dark:text-green-400" : "text-foreground/70"}`}>
            {exercise.text}
          </p>
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
            return (
              <div
                key={i}
                className="flex flex-col gap-1 py-2 px-2 rounded-lg border border-border/50 bg-background/50"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${exercise.id}`}
                    checked={alt.correct}
                    onChange={() =>
                      onAlternativeChange?.(lesson.lessonNumber, exercise.id, i, { correct: true })
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
                        ? "border-primary/40 text-primary"
                        : "border-border text-foreground/70"
                    }`}
                  />
                  {alt.correct && (
                    <span className="text-xs font-semibold text-primary shrink-0">correta</span>
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
                alt.correct ? "bg-primary/10 text-primary" : "text-foreground/60"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">{alt.correct ? "✓" : "○"}</span>
                <div className="flex-1">
                  {textChanged && (
                    <p className="text-xs line-through text-destructive/70">{origAlt!.text}</p>
                  )}
                  <span className={textChanged ? "text-green-600 dark:text-green-400" : ""}>{alt.text}</span>
                  {correctChanged && (
                    <span className="ml-2 text-xs text-yellow-500">
                      {alt.correct
                        ? "(marcada como correta pelo instrutor)"
                        : "(desmarcada pelo instrutor)"}
                    </span>
                  )}
                </div>
                {alt.correct && (
                  <span className="ml-auto text-xs font-semibold text-primary shrink-0">
                    correta
                  </span>
                )}
              </div>
              {opinionChanged && (
                <p className="text-xs line-through text-destructive/70 pl-5">{origAlt!.opinion}</p>
              )}
              {alt.opinion && (
                <p className={`text-xs pl-5 ${opinionChanged ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>{alt.opinion}</p>
              )}
            </div>
          );
        })}
      </div>

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
              <label className="text-xs text-primary/70">Comentário adicionado pelo instrutor</label>
              <p className="text-sm text-foreground/70 bg-primary/5 rounded-lg px-3 py-2 border border-primary/20">
                {exercise.comment}
              </p>
            </div>
          )}
          {originalExercise && originalExercise.comment && originalExercise.comment !== exercise.comment && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Comentário (editado pelo instrutor)</label>
              <p className="text-xs line-through text-destructive/70 bg-muted/50 rounded px-3 py-1">
                {originalExercise.comment}
              </p>
              <p className="text-sm text-foreground/70 bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
                {exercise.comment}
              </p>
            </div>
          )}
          {!originalExercise && exercise.comment && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Comentário do instrutor</label>
              <p className="text-sm text-foreground/70 bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
                {exercise.comment}
              </p>
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
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            + Incluir na seleção
          </button>
        </div>
      )}
    </div>
  );
}
