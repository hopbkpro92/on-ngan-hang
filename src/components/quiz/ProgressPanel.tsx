"use client";

import { Flame, Medal, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProgressLevel, type QuizProgress } from "@/lib/quiz-progress";
import { getTranslations, type Language } from "@/lib/i18n";

interface ProgressPanelProps {
    progress: QuizProgress;
    language: Language;
}

export default function ProgressPanel({ progress, language }: ProgressPanelProps) {
    const t = getTranslations(language);
    const level = getProgressLevel(progress.xp);
    const dailyProgress = Math.min(
        100,
        Math.round((progress.dailyQuestions / progress.dailyGoal) * 100),
    );

    return (
        <Card className="w-full border-primary/15 bg-card/90 shadow-md">
            <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Medal className="h-5 w-5 text-accent" />
                    {t.progressTitle}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-5 sm:pt-0 lg:grid-cols-4">
                <div className="rounded-md border border-border p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.level}</p>
                    <p className="mt-1 text-xl font-bold text-primary">{level.level}</p>
                    <Progress value={level.current} className="mt-2 h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{level.current}/{level.next - (level.level - 1) * 100} XP</p>
                </div>
                <div className="rounded-md border border-border p-3">
                    <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <Flame className="h-3.5 w-3.5 text-orange-500" /> {t.streak}
                    </p>
                    <p className="mt-1 text-xl font-bold text-orange-500">{progress.studyStreak}</p>
                    <p className="text-xs text-muted-foreground">{t.days}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                    <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <Target className="h-3.5 w-3.5 text-primary" /> {t.dailyGoal}
                    </p>
                    <p className="mt-1 text-xl font-bold text-primary">{progress.dailyQuestions}/{progress.dailyGoal}</p>
                    <Progress value={dailyProgress} className="mt-2 h-1.5" />
                </div>
                <div className="rounded-md border border-border p-3">
                    <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5 text-correct-answer" /> {t.accuracy}
                    </p>
                    <p className="mt-1 text-xl font-bold text-correct-answer">{progress.accuracy}%</p>
                    <p className="text-xs text-muted-foreground">{progress.correctAnswers}/{progress.totalQuestions} {t.correctAnswers}</p>
                </div>
            </CardContent>
        </Card>
    );
}
