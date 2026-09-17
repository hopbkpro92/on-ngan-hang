import { describe, expect, it } from "vitest";
import type { Question } from "../src/lib/quiz-data";
import {
    getStoredWrongQuestions,
    loadWrongAnswerIds,
    recordWrongAnswers,
} from "../src/lib/quiz-wrong-answers";

const questions: Question[] = [
    { id: 10, question: "10", options: ["A", "B"], correctAnswerIndex: 0 },
    { id: 20, question: "20", options: ["A", "B"], correctAnswerIndex: 1 },
];

function createStorage(): Storage {
    const values = new Map<string, string>();
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
        clear: () => values.clear(),
        key: (index) => [...values.keys()][index] ?? null,
        get length() { return values.size; },
    };
}

describe("wrong answer history", () => {
    it("stores wrong IDs and removes IDs answered correctly later", () => {
        const storage = createStorage();
        recordWrongAnswers(storage, "file.xlsx", questions, [1, null]);

        expect(loadWrongAnswerIds(storage, "file.xlsx")).toEqual([10, 20]);

        recordWrongAnswers(storage, "file.xlsx", questions, [0, 0]);
        expect(loadWrongAnswerIds(storage, "file.xlsx")).toEqual([20]);
    });

    it("returns stored questions in the current question order", () => {
        expect(getStoredWrongQuestions(questions, [20])).toEqual([questions[1]]);
    });
});