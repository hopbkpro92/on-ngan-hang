import type { Question } from "./quiz-data";

const WRONG_ANSWERS_STORAGE_KEY = "quiz-wrong-answers-v1";

type WrongAnswerHistory = Record<string, number[]>;

function loadHistory(storage: Storage): WrongAnswerHistory {
    try {
        const stored = storage.getItem(WRONG_ANSWERS_STORAGE_KEY);
        if (!stored) {
            return {};
        }

        const parsed = JSON.parse(stored) as WrongAnswerHistory;
        return Object.fromEntries(
            Object.entries(parsed).map(([filePath, ids]) => [
                filePath,
                Array.isArray(ids)
                    ? ids.filter((id): id is number => Number.isInteger(id))
                    : [],
            ]),
        );
    } catch {
        return {};
    }
}

function saveHistory(storage: Storage, history: WrongAnswerHistory): void {
    try {
        storage.setItem(WRONG_ANSWERS_STORAGE_KEY, JSON.stringify(history));
    } catch {
        // Ignore unavailable or quota-exceeded browser storage.
    }
}

export function loadWrongAnswerIds(storage: Storage, filePath: string): number[] {
    return loadHistory(storage)[filePath] ?? [];
}

export function recordWrongAnswers(
    storage: Storage,
    filePath: string,
    questions: Question[],
    answers: (number | null)[],
): void {
    const wrongIds = new Set(loadWrongAnswerIds(storage, filePath));

    questions.forEach((question, index) => {
        if (answers[index] === question.correctAnswerIndex) {
            wrongIds.delete(question.id);
        } else {
            wrongIds.add(question.id);
        }
    });

    const history = loadHistory(storage);
    history[filePath] = [...wrongIds].sort((first, second) => first - second);
    saveHistory(storage, history);
}

export function getStoredWrongQuestions(
    questions: Question[],
    wrongIds: number[],
): Question[] {
    const ids = new Set(wrongIds);
    return questions
        .filter((question) => ids.has(question.id))
        .sort((first, second) => first.id - second.id);
}