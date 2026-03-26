const STORAGE_KEY = "select_activity_course";

export function saveCourse(content: string): void {
  sessionStorage.setItem(STORAGE_KEY, content);
}

export function getCourse(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearCourse(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
