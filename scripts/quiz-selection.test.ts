import { describe, expect, it, vi } from "vitest";
import type { Question } from "../src/lib/quiz-data";
import {
    filterQuestionsByIdRange,
    getQuestionIdRange,
    selectQuestions,
} from "../src/lib/quiz-selection";

const questions: Question[] = [
    { id: 10, question: "10", options: ["A", "B"], correctAnswerIndex: 0 },
    { id: 20, question: "20", options: ["A", "B"], correctAnswerIndex: 0 },
    { id: 40, question: "40", options: ["A", "B"], correctAnswerIndex: 0 },
];

describe("quiz question selection", () => {
    it("filters by inclusive question ID range and keeps gaps out", () => {
        expect(filterQuestionsByIdRange(questions, 15, 40)).toEqual([
            questions[1],
            questions[2],
        ]);
    });

    it("reports the actual minimum and maximum IDs", () => {
        expect(getQuestionIdRange(questions)).toEqual({ minId: 10, maxId: 40 });
        expect(getQuestionIdRange([])).toBeNull();
    });

    it("returns questions in ID order for sequential selection", () => {
        expect(selectQuestions([questions[2], questions[0]], 2, "sequential"))
            .toEqual([questions[0], questions[2]]);
    });

    it("selects a limited random set without mutating the source", () => {
        vi.spyOn(Math, "random").mockReturnValue(0.1);

        const source = [...questions];
        const selected = selectQuestions(source, 2, "random");

        expect(selected).toHaveLength(2);
        expect(source).toEqual(questions);
        vi.restoreAllMocks();
    });
});