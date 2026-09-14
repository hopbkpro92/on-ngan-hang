export type LearningFeedback = "milestone" | "encouragement" | "none";
export type PracticeFeedback = "praise" | "encouragement" | "none";

export function getLearningFeedback(
    streak: number,
    isCorrect: boolean,
): LearningFeedback {
    if (!isCorrect) {
        return "encouragement";
    }

    return streak > 0 && streak % 5 === 0 ? "milestone" : "none";
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
