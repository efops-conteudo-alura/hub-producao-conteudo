export type Alternative = {
  text: string;
  correct: boolean;
  opinion: string;
};

export type Exercise = {
  id: string;
  title: string;
  text: string;
  kind: string;
  dataTag?: string;
  sampleAnswer?: string;
  alternatives: Alternative[];
  comment?: string;
  isSelected?: boolean;
};

export type Lesson = {
  lessonNumber: number;
  title?: string;
  exercises: Exercise[];
};

export type Course = {
  courseId: string;
  lessons: Lesson[];
};

export type PersonType = "instructor" | "coordinator";
