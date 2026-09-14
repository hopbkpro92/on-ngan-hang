import { describe, expect, it } from "vitest";
import {
    getLearningFeedback,
    getPracticeFeedback,
} from "../src/lib/quiz-feedback";

describe("quiz feedback rules", () => {
    it("celebrates learning streak milestones", () => {
        expect(getLearningFeedback(3, true)).toBe("streak3");
        expect(getLearningFeedback(5, true)).toBe("streak5");
        expect(getLearningFeedback(10, true)).toBe("streak10");
        expect(getLearningFeedback(6, true)).toBe("none");
    });

    it("encourages learning users after an incorrect answer", () => {
        expect(getLearningFeedback(0, false)).toBe("encouragement");
    });

    it("praises strong practice accuracy", () => {
        expect(getPracticeFeedback(80)).toBe("praise");
        expect(getPracticeFeedback(95)).toBe("praise");
    });

    it("encourages practice users below the accuracy threshold", () => {
        expect(getPracticeFeedback(49)).toBe("encouragement");
        expect(getPracticeFeedback(50)).toBe("none");
    });
});
