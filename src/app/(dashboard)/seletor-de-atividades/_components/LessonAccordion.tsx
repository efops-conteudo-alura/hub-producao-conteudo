"use client";

import { useState } from "react";
import type { Alternative, Exercise, Lesson } from "@/types/course";
import { ExerciseCard } from "./ExerciseCard";

type Props = {
  lesson: Lesson;
  selectable?: boolean;
  onToggle?: (lesson: Lesson, exercise: Exercise) => void;
  readOnly?: boolean;
  editable?: boolean;
  comments?: Record<string, string>;
  onCommentChange?: (lessonNumber: number, exerciseId: string, comment: string) => void;
  onExerciseChange?: (lessonNumber: number, exerciseId: string, changes: Partial<Exercise>) => void;
  onAlternativeChange?: (lessonNumber: number, exerciseId: string, altIndex: number, changes: Partial<Alternative>) => void;
  originalLesson?: Lesson;
  editingExerciseId?: string | null;
  onEditToggle?: (exerciseId: string) => void;
  onRestore?: (lessonNumber: number, exercise: Exercise) => void;
  onRemove?: (lessonNumber: number, exerciseId: string) => void;
  defaultOpen?: boolean;
};

export function LessonAccordion({
  lesson,
  selectable = false,
  onToggle,
  readOnly = false,
  editable = false,
  comments,
  onCommentChange,
  onExerciseChange,
  onAlternativeChange,
  originalLesson,
  editingExerciseId,
  onEditToggle,
  onRestore,
  onRemove,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/50 transition-colors text-left"
      >
        <span className="font-heading font-bold text-foreground">
          Aula {lesson.lessonNumber}
          {lesson.title && (
            <span className="font-normal text-muted-foreground"> · {lesson.title}</span>
          )}
        </span>
        <span className="text-muted-foreground text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 p-4 bg-background/60">
          {lesson.exercises.map((exercise) => {
            const origExercise = originalLesson?.exercises.find((e) => e.id === exercise.id);
            return (
              <ExerciseCard
                key={exercise.id}
                lesson={lesson}
                exercise={exercise}
                selectable={selectable}
                onToggle={onToggle}
                readOnly={readOnly}
                editable={editable}
                isEditing={editingExerciseId === exercise.id}
                onEditToggle={onEditToggle}
                onRestore={onRestore}
                onRemove={onRemove}
                comment={comments?.[exercise.id]}
                onCommentChange={onCommentChange}
                onExerciseChange={onExerciseChange}
                onAlternativeChange={onAlternativeChange}
                originalExercise={origExercise}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
