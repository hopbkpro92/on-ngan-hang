"use client";

import { useState, useEffect } from "react";
import type { QuizMode } from "@/app/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getTranslations, type Language } from "@/lib/i18n";

interface QuizSetupProps {
    onStartQuiz: (numQuestions: number, mode: QuizMode) => void;
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
    maxQuestions,
    isLoading = false,
    hasLoadedQuestions = false,
    hasFilesAvailable = false,
    initialMode,
    language
}: QuizSetupProps) {
    const [numQuestions, setNumQuestions] = useState<string>("");
    const [selectedMode, setSelectedMode] = useState<QuizMode>(initialMode);
    const { toast } = useToast();
    const t = getTranslations(language);

    useEffect(() => {
        if (selectedMode === "exam") {
            // Default to 100 questions for exam mode
            setNumQuestions("100");
        } else if (selectedMode === "challenge") {
            setNumQuestions(Math.min(10, maxQuestions).toString());
        } else if (maxQuestions > 0) {
            setNumQuestions(Math.min(10, maxQuestions).toString());
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

        // For exam mode, allow custom number but suggest 100
        if (selectedMode !== "exam" && num > maxQuestions) {
            toast({
                title: t.tooManyQuestions,
                description: `${t.enterAtMost} ${maxQuestions}.`,
                variant: "destructive",
            });
            return;
        }

        onStartQuiz(num, selectedMode);
    };

    const isSetupDisabled = !hasFilesAvailable || isLoading || (selectedMode !== "exam" && (!hasLoadedQuestions || maxQuestions === 0));
    const isFixedQuestionMode = selectedMode === "exam" || selectedMode === "challenge";
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
                <div className="space-y-2">
                    <Label htmlFor="numQuestions" className="text-base font-semibold sm:text-lg">{t.numberOfQuestions}</Label>
                    <Input
                        id="numQuestions"
                        type="number"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(e.target.value)}
                        min="1"
                        max={selectedMode === "exam" ? undefined : (maxQuestions > 0 ? maxQuestions : undefined)}
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
                                ? `(Max: ${maxQuestions})`
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
                        onValueChange={(value: string) => setSelectedMode(value as QuizMode)}
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
            <CardFooter className="p-4 pt-0 sm:p-6 sm:pt-0">
                <Button
                    onClick={handleStart}
                    className="h-11 w-full text-base sm:w-auto sm:px-8"
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
