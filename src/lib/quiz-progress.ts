export interface QuizProgress {
    version: 1;
    xp: number;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    studyStreak: number;
    lastStudyDate: string | null;
    dailyGoal: number;
    dailyQuestions: number;
    dailyGoalDate: string | null;
    sessionsCompleted: number;
}

export interface QuizResultSummary {
    totalQuestions: number;
    correctAnswers: number;
}

export const QUIZ_PROGRESS_STORAGE_KEY = "quiz-progress-v1";
export const DEFAULT_DAILY_GOAL = 10;

export function createInitialProgress(): QuizProgress {
    return {
        version: 1,
        xp: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        studyStreak: 0,
        lastStudyDate: null,
        dailyGoal: DEFAULT_DAILY_GOAL,
        dailyQuestions: 0,
        dailyGoalDate: null,
        sessionsCompleted: 0,
    };
}

export function getProgressLevel(xp: number) {
    const level = Math.floor(Math.max(0, xp) / 100) + 1;
    const levelStart = (level - 1) * 100;
    return {
        level,
        current: Math.max(0, xp) - levelStart,
        next: level * 100,
    };
}

function getPreviousDate(date: string): string {
    const previous = new Date(`${date}T00:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    return previous.toISOString().slice(0, 10);
}

export function recordQuizResult(
    current: QuizProgress,
    result: QuizResultSummary,
    studyDate: string,
): QuizProgress {
    const totalQuestions = Math.max(0, result.totalQuestions);
    const correctAnswers = Math.min(
        totalQuestions,
        Math.max(0, result.correctAnswers),
    );
    const nextTotalQuestions = current.totalQuestions + totalQuestions;
    const nextCorrectAnswers = current.correctAnswers + correctAnswers;
    const nextDailyQuestions = current.dailyGoalDate === studyDate
        ? current.dailyQuestions + totalQuestions
        : totalQuestions;
    const studyStreak = current.lastStudyDate === studyDate
        ? current.studyStreak
        : current.lastStudyDate === getPreviousDate(studyDate)
            ? current.studyStreak + 1
            : 1;

    return {
        ...current,
        xp: current.xp + correctAnswers * 10 + 5,
        totalQuestions: nextTotalQuestions,
        correctAnswers: nextCorrectAnswers,
        accuracy: nextTotalQuestions === 0
            ? 0
            : Math.round((nextCorrectAnswers / nextTotalQuestions) * 100),
        studyStreak,
        lastStudyDate: studyDate,
        dailyQuestions: nextDailyQuestions,
        dailyGoalDate: studyDate,
        sessionsCompleted: current.sessionsCompleted + 1,
    };
}

export function loadQuizProgress(): QuizProgress {
    if (typeof window === "undefined") {
        return createInitialProgress();
    }

    try {
        const stored = window.localStorage.getItem(QUIZ_PROGRESS_STORAGE_KEY);
        if (!stored) {
            return createInitialProgress();
        }

        const parsed = JSON.parse(stored) as Partial<QuizProgress>;
        return { ...createInitialProgress(), ...parsed, version: 1 };
    } catch {
        return createInitialProgress();
    }
}

export function saveQuizProgress(progress: QuizProgress): void {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(
            QUIZ_PROGRESS_STORAGE_KEY,
            JSON.stringify(progress),
        );
    }
}
