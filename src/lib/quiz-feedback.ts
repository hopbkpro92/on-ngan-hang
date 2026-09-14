export type LearningFeedback = "streak3" | "streak5" | "streak10" | "encouragement" | "none";
export type PracticeFeedback = "praise" | "encouragement" | "none";

export function getLearningFeedback(
    streak: number,
    isCorrect: boolean,
): LearningFeedback {
    if (!isCorrect) {
        return "encouragement";
    }

    if (streak > 0 && streak % 10 === 0) {
        return "streak10";
    }

    if (streak === 5) {
        return "streak5";
    }

    if (streak === 3) {
        return "streak3";
    }

    return "none";
}

export function getPracticeFeedback(accuracy: number): PracticeFeedback {
    if (accuracy >= 80) {
        return "praise";
    }

    if (accuracy < 50) {
        return "encouragement";
    }

    return "none";
}
