import { describe, expect, it } from "vitest";
import {
    createInitialProgress,
    getProgressLevel,
    recordQuizResult,
} from "../src/lib/quiz-progress";

describe("local quiz progress", () => {
    it("awards XP and updates accuracy after a completed quiz", () => {
        const progress = recordQuizResult(
            createInitialProgress(),
            { totalQuestions: 10, correctAnswers: 8 },
            "2026-09-14",
        );

        expect(progress.xp).toBe(85);
        expect(progress.totalQuestions).toBe(10);
        expect(progress.correctAnswers).toBe(8);
        expect(progress.accuracy).toBe(80);
        expect(progress.dailyQuestions).toBe(10);
    });

    it("continues a streak on consecutive study days", () => {
        const firstDay = recordQuizResult(
            createInitialProgress(),
            { totalQuestions: 5, correctAnswers: 5 },
            "2026-09-14",
        );
        const secondDay = recordQuizResult(
            firstDay,
            { totalQuestions: 5, correctAnswers: 4 },
            "2026-09-15",
        );

        expect(secondDay.studyStreak).toBe(2);
        expect(secondDay.dailyQuestions).toBe(5);
    });

    it("maps XP to predictable levels", () => {
        expect(getProgressLevel(0)).toEqual({ level: 1, current: 0, next: 100 });
        expect(getProgressLevel(125)).toEqual({ level: 2, current: 25, next: 200 });
    });
});
