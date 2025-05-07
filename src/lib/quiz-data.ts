export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-indexed
}
