export interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswerIndex: number; // 0-indexed
}

export interface QuizFileMetadata {
    path: string;
    role: string;
    examQuestions: number;
}

export type UserRole = "Kế toán" | "Kiểm ngân" | "Tín dụng" | "Quản lý";

