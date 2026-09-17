import type { Question } from "./quiz-data";

export type SelectionOrder = "sequential" | "random";

export function getQuestionIdRange(questions: Question[]): {
    minId: number;
    maxId: number;
} | null {
    if (questions.length === 0) {
        return null;
    }

    return questions.reduce(
        (range, question) => ({
            minId: Math.min(range.minId, question.id),
            maxId: Math.max(range.maxId, question.id),
        }),
        { minId: questions[0].id, maxId: questions[0].id },
    );
}

export function filterQuestionsByIdRange(
    questions: Question[],
    fromId: number,
    toId: number,
): Question[] {
    const lowerBound = Math.min(fromId, toId);
    const upperBound = Math.max(fromId, toId);

    return questions
        .filter((question) => question.id >= lowerBound && question.id <= upperBound)
        .sort((first, second) => first.id - second.id);
}

export function selectQuestions(
    questions: Question[],
    count: number,
    order: SelectionOrder,
): Question[] {
    const limitedCount = Math.max(0, Math.min(count, questions.length));
    const sortedQuestions = [...questions].sort((first, second) => first.id - second.id);

    if (order === "sequential") {
        return sortedQuestions.slice(0, limitedCount);
    }

    const shuffled = [...sortedQuestions];
    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled.slice(0, limitedCount);
}