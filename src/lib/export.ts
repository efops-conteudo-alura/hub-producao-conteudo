import type { Course, Lesson } from "@/types/course";

export function exportSelectedCourse(course: Course, selectedLessons: Lesson[]): void {
  const exportData = {
    courseId: course.courseId,
    sections: selectedLessons.map((lesson) => {
      const section: Record<string, unknown> = {};
      if (lesson.title) section.title = lesson.title;
      section.activities = lesson.exercises.map(
        ({ isSelected: _1, id: _2, comment: _3, text, kind, dataTag, title, sampleAnswer, alternatives, enhancedByLuri }) => {
          const activity: Record<string, unknown> = { taskEnum: kind };
          if (dataTag !== undefined) activity.dataTag = dataTag;
          activity.title = title;
          activity.body = text;
          if (sampleAnswer !== undefined) activity.opinion = sampleAnswer;
          if (enhancedByLuri) activity.enhancedByLuri = true;
          activity.alternatives = alternatives.map(({ text: body, opinion: justification, correct }) => ({
            body,
            justification,
            correct,
          }));
          return activity;
        }
      );
      return section;
    }),
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${course.courseId}-atividades.json`;
  a.click();
  URL.revokeObjectURL(url);
}
