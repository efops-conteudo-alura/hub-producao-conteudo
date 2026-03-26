import type { Course, Lesson } from "@/types/course";

export function exportSelectedCourse(
  course: Course,
  selectedLessons: Lesson[]
): void {
  const exportData: Course = {
    courseId: course.courseId,
    lessons: selectedLessons.map((lesson) => ({
      lessonNumber: lesson.lessonNumber,
      exercises: lesson.exercises.map(({ isSelected: _, ...rest }) => rest),
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${course.courseId}-selected-lessons.json`;
  a.click();
  URL.revokeObjectURL(url);
}
