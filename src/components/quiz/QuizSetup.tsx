"use client";

import { useState, useEffect } from "react";
import type { QuizMode } from "@/app/page";
import type { Question } from "@/lib/quiz-data";
import {
    filterQuestionsByIdRange,
    type SelectionOrder,
} from "@/lib/quiz-selection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getTranslations, type Language } from "@/lib/i18n";

interface QuizSetupProps {
    onStartQuiz: (
        numQuestions: number,
        mode: QuizMode,
        fromId: number,
        toId: number,
        order: SelectionOrder,
    ) => void;
    onReviewStoredIncorrect: (fromId: number, toId: number) => void;
    questions: Question[];
    questionIdRange: { minId: number; maxId: number } | null;
    initialFromId: number;
    initialToId: number;
    initialSelectionOrder: SelectionOrder;
    storedWrongCount: number;
    maxQuestions: number;
    isLoading?: boolean;
    hasLoadedQuestions?: boolean;
    hasFilesAvailable?: boolean;
    initialMode: QuizMode;
    language: Language;
}
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Rocket, Loader2, GraduationCap, CheckSquareIcon, Timer } from "lucide-react";
export default function QuizSetup({
    onStartQuiz,
    onReviewStoredIncorrect,
    questions,
    questionIdRange,
    initialFromId,
    initialToId,
    initialSelectionOrder,
    storedWrongCount,
    maxQuestions,
    isLoading = false,
    hasLoadedQuestions = false,
    hasFilesAvailable = false,
    initialMode,
    language
}: QuizSetupProps) {
    const [numQuestions, setNumQuestions] = useState<string>("");
    const [selectedMode, setSelectedMode] = useState<QuizMode>(initialMode);
    const [fromId, setFromId] = useState(String(initialFromId));
    const [toId, setToId] = useState(String(initialToId));
    const [selectionOrder, setSelectionOrder] = useState<SelectionOrder>(initialSelectionOrder);
    const { toast } = useToast();
    const t = getTranslations(language);

    const handleModeChange = (value: string) => {
        const scrollPosition = window.scrollY;
        setSelectedMode(value as QuizMode);

        requestAnimationFrame(() => {
            window.scrollTo({ top: scrollPosition, behavior: "auto" });
        });
    };

    const updateQuestionRange = (nextFromId: string, nextToId: string) => {
        setFromId(nextFromId);
        setToId(nextToId);

        const validCount = filterQuestionsByIdRange(
            questions,
            Number(nextFromId),
            Number(nextToId),
        ).length;
        setNumQuestions(validCount > 0 ? String(validCount) : "0");
    };

    useEffect(() => {
        setFromId(String(initialFromId));
        setToId(String(initialToId));
        setSelectionOrder(initialSelectionOrder);
    }, [initialFromId, initialToId, initialSelectionOrder]);

    useEffect(() => {
        if (selectedMode === "exam") {
            // Default to 100 questions for exam mode
            setNumQuestions("100");
        } else if (selectedMode === "challenge") {
            setNumQuestions(Math.min(10, maxQuestions).toString());
        } else if (maxQuestions > 0) {
            setNumQuestions(maxQuestions.toString());
        } else {
            setNumQuestions("0");
        }
    }, [maxQuestions, selectedMode]);

    const handleStart = () => {
        if (!hasFilesAvailable) {
            toast({
                title: t.noQuizFilesAvailable,
                description: t.addExcelAndRefresh,
                variant: "destructive",
            });
            return;
        }

        // Exam and challenge modes still require an available question source.
        if (selectedMode !== "exam") {
            if (!hasLoadedQuestions || maxQuestions === 0) {
                toast({
                    title: t.noQuestionsLoaded,
                    description: t.checkSelectedFile,
                    variant: "destructive",
                });
                return;
            }
        }

        const num = parseInt(numQuestions, 10);
        if (isNaN(num) || num <= 0) {
            toast({
                title: t.invalidNumber,
                description: t.enterPositiveNumber,
                variant: "destructive",
            });
            return;
        }

        const parsedFromId = parseInt(fromId, 10);
        const parsedToId = parseInt(toId, 10);
        const isRangeMode = selectedMode === "learning" || selectedMode === "testing";
        if (isRangeMode && (
            isNaN(parsedFromId) ||
            isNaN(parsedToId) ||
            parsedFromId > parsedToId
        )) {
            toast({
                title: t.invalidNumber,
                description: t.invalidQuestionRange,
                variant: "destructive",
            });
            return;
        }

        const validQuestionCount = isRangeMode
            ? filterQuestionsByIdRange(questions, parsedFromId, parsedToId).length
            : maxQuestions;

        // For exam mode, allow custom number but suggest 100
        if (selectedMode !== "exam" && num > validQuestionCount) {
            toast({
                title: t.tooManyQuestions,
                description: `${t.enterAtMost} ${validQuestionCount}.`,
                variant: "destructive",
            });
            return;
        }

        onStartQuiz(
            num,
            selectedMode,
            isRangeMode ? parsedFromId : 0,
            isRangeMode ? parsedToId : 0,
            selectionOrder,
        );
    };

    const isSetupDisabled = !hasFilesAvailable || isLoading || (selectedMode !== "exam" && (!hasLoadedQuestions || maxQuestions === 0));
    const isFixedQuestionMode = selectedMode === "exam" || selectedMode === "challenge";
    const isRangeMode = selectedMode === "learning" || selectedMode === "testing";
    const validQuestionCount = questionIdRange
        ? filterQuestionsByIdRange(questions, Number(fromId), Number(toId)).length
        : 0;
    const isButtonDisabled = isSetupDisabled || parseInt(numQuestions) <= 0 || isNaN(parseInt(numQuestions));

    // let descriptionText = "Choose your mode and number of questions to test your knowledge.";
    // if (!hasFilesAvailable) {
    //     descriptionText = "No quiz files found. Please add Excel files to the public folder.";
    // } else if (isLoading) {
    //     descriptionText = "Loading questions from the selected file...";
    // } else if (selectedMode !== "exam" && !hasLoadedQuestions && hasFilesAvailable) {
    //     descriptionText = "No questions found in the selected file. Please check the file or select another.";
    // }

    return (
        <Card className={`w-full shadow-xl ${isLoading ? 'opacity-70' : ''} mx-auto`}>
            {/* <CardHeader className="p-3 md:p-4">
                <CardTitle className="text-2xl md:text-3xl font-bold text-center">Quiz Whiz Challenge!</CardTitle>
                <CardDescription className="text-center text-muted-foreground min-h-[1.5em] md:min-h-[2em] text-sm md:text-base">
                    {descriptionText}
                </CardDescription>
            </CardHeader> */}
            <CardContent className="space-y-6 p-4 sm:p-6">
                {isRangeMode && questionIdRange && (
                    <>
                        <div className="space-y-2">
                            <Label className="text-base font-semibold sm:text-lg">{t.questionIdRange}</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="fromQuestionId" className="text-sm text-muted-foreground">{t.fromQuestionId}</Label>
                                    <Input
                                        id="fromQuestionId"
                                        type="number"
                                        value={fromId}
                                        onChange={(event) => updateQuestionRange(event.target.value, toId)}
                                        min={questionIdRange.minId}
                                        max={questionIdRange.maxId}
                                        disabled={isSetupDisabled}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="toQuestionId" className="text-sm text-muted-foreground">{t.toQuestionId}</Label>
                                    <Input
                                        id="toQuestionId"
                                        type="number"
                                        value={toId}
                                        onChange={(event) => updateQuestionRange(fromId, event.target.value)}
                                        min={questionIdRange.minId}
                                        max={questionIdRange.maxId}
                                        disabled={isSetupDisabled}
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t.validQuestionsInRange.replace("{count}", String(validQuestionCount))}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-base font-semibold sm:text-lg">{t.selectionOrder}</Label>
                            <RadioGroup
                                value={selectionOrder}
                                onValueChange={(value) => setSelectionOrder(value as SelectionOrder)}
                                className="grid gap-2 sm:grid-cols-2"
                                disabled={isSetupDisabled}
                            >
                                <Label htmlFor="order-sequential" className="flex cursor-pointer items-center space-x-2 rounded-md border border-border p-3">
                                    <RadioGroupItem value="sequential" id="order-sequential" />
                                    <span>{t.sequentialOrder}</span>
                                </Label>
                                <Label htmlFor="order-random" className="flex cursor-pointer items-center space-x-2 rounded-md border border-border p-3">
                                    <RadioGroupItem value="random" id="order-random" />
                                    <span>{t.randomOrder}</span>
                                </Label>
                            </RadioGroup>
                        </div>
                    </>
                )}
                <div className="space-y-2">
                    <Label htmlFor="numQuestions" className="text-base font-semibold sm:text-lg">{t.numberOfQuestions}</Label>
                    <Input
                        id="numQuestions"
                        type="number"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(e.target.value)}
                        min="1"
                        max={selectedMode === "exam" ? undefined : (isRangeMode ? validQuestionCount : maxQuestions)}
                        className="h-11 bg-card text-base focus:border-primary focus:ring-primary"
                        data-ai-hint="number input"
                        disabled={isSetupDisabled || isFixedQuestionMode}
                    />
                    <p className="text-sm text-muted-foreground">
                        {selectedMode === "exam"
                            ? `(${t.recommended})`
                            : selectedMode === "challenge"
                                ? `(${t.quickChallengeDescription})`
                            : hasFilesAvailable && hasLoadedQuestions && maxQuestions > 0
                                ? `(Max: ${validQuestionCount})`
                                : hasFilesAvailable && isLoading
                                    ? `(${t.loadingQuestionsHint})`
                                    : hasFilesAvailable && !hasLoadedQuestions
                                        ? `(${t.noQuestionsInFile})`
                                        : `(${t.noQuizFilesHint})`}
                    </p>
                </div>
                {/* TODO: If you have a quiz file selector, add disabled={isExamMode} to its props here. */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold sm:text-lg">{t.selectMode}</Label>
                    <RadioGroup
                        value={selectedMode}
                        onValueChange={handleModeChange}
                        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                        disabled={isSetupDisabled}
                    >
                        <Label htmlFor="mode-learning" className={`flex items-center space-x-2 rounded-md border border-border p-3 transition-colors hover:bg-accent/10 ${isSetupDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                            <RadioGroupItem value="learning" id="mode-learning" disabled={isSetupDisabled} />
                            <span className="flex items-center text-sm md:text-base">
                                <GraduationCap className="mr-1.5 h-4 w-4 md:h-5 md:w-5 text-accent" /> {t.learningMode}
                            </span>
                        </Label>
                        <Label htmlFor="mode-testing" className={`flex items-center space-x-2 rounded-md border border-border p-3 transition-colors hover:bg-accent/10 ${isSetupDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                            <RadioGroupItem value="testing" id="mode-testing" disabled={isSetupDisabled} />
                            <span className="flex items-center text-sm md:text-base">
                                <CheckSquareIcon className="mr-1.5 h-4 w-4 md:h-5 md:w-5 text-primary" /> {t.testingMode}
                            </span>
                        </Label>
                        <Label htmlFor="mode-challenge" className={`flex items-center space-x-2 rounded-md border border-border p-3 transition-colors hover:bg-accent/10 ${isSetupDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                            <RadioGroupItem value="challenge" id="mode-challenge" disabled={isSetupDisabled} />
                            <span className="flex items-center text-sm md:text-base">
                                <Timer className="mr-1.5 h-4 w-4 md:h-5 md:w-5 text-orange-500" /> {t.quickChallenge}
                            </span>
                        </Label>
                        <Label htmlFor="mode-exam" className={`flex items-center space-x-2 rounded-md border border-border p-3 transition-colors hover:bg-accent/10 ${!hasFilesAvailable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                            <RadioGroupItem value="exam" id="mode-exam" disabled={!hasFilesAvailable} />
                            <span className="flex items-center text-sm md:text-base">
                                <Rocket className="mr-1.5 h-4 w-4 md:h-5 md:w-5 text-green-500" /> {t.examModeShort}
                            </span>
                        </Label>
                    </RadioGroup>
                </div>
            </CardContent>
            <CardFooter className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center justify-center gap-2 border-t border-border/80 bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur sm:left-1/2 sm:right-auto sm:w-[calc(100%-2rem)] sm:max-w-4xl sm:-translate-x-1/2 sm:rounded-md sm:border sm:border-border/80 sm:bg-card/95 sm:p-3 sm:shadow-lg sm:backdrop-blur">
                {isRangeMode && storedWrongCount > 0 && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onReviewStoredIncorrect(Number(fromId), Number(toId))}
                        className="h-11 w-full text-base sm:w-auto"
                        disabled={isSetupDisabled}
                    >
                        {t.reviewSavedIncorrect} ({storedWrongCount})
                    </Button>
                )}
                <Button
                    onClick={handleStart}
                    className="h-11 w-full text-base sm:px-8"
                    disabled={isButtonDisabled}
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    ) : (
                        <Rocket className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    )}
                    {isLoading ? t.loadingShort : t.startQuiz}
                </Button>
            </CardFooter>
        </Card>
    );
}
