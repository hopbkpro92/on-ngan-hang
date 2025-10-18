"use client";

import { useState, useEffect } from "react";
import type { QuizMode } from "@/app/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface QuizSetupProps {
    onStartQuiz: (numQuestions: number, mode: QuizMode) => void;
    maxQuestions: number;
    isLoading?: boolean;
    hasLoadedQuestions?: boolean;
    hasFilesAvailable?: boolean;
    initialMode: QuizMode;
}
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Rocket, Loader2, GraduationCap, CheckSquareIcon } from "lucide-react";
export default function QuizSetup({
    onStartQuiz,
    maxQuestions,
    isLoading = false,
    hasLoadedQuestions = false,
    hasFilesAvailable = false,
    initialMode
}: QuizSetupProps) {
    const [numQuestions, setNumQuestions] = useState<string>("");
    const [selectedMode, setSelectedMode] = useState<QuizMode>(initialMode);
    const { toast } = useToast();

    useEffect(() => {
        if (selectedMode === "exam") {
            // Default to 100 questions for exam mode
            setNumQuestions("100");
        } else if (maxQuestions > 0) {
            setNumQuestions(Math.min(10, maxQuestions).toString());
        } else {
            setNumQuestions("0");
        }
    }, [maxQuestions, selectedMode]);

    const handleStart = () => {
        if (!hasFilesAvailable) {
            toast({
                title: "No Quiz Files Available",
                description: "Please add Excel files to the 'public' folder and refresh.",
                variant: "destructive",
            });
            return;
        }

        // For exam mode, we don't need questions loaded from current file
        if (selectedMode !== "exam") {
            if (!hasLoadedQuestions || maxQuestions === 0) {
                toast({
                    title: "No Questions Loaded",
                    description: "The selected file might be empty or incorrectly formatted. Try another file.",
                    variant: "destructive",
                });
                return;
            }
        }

        const num = parseInt(numQuestions, 10);
        if (isNaN(num) || num <= 0) {
            toast({
                title: "Invalid Number",
                description: "Please enter a valid number of questions greater than 0.",
                variant: "destructive",
            });
            return;
        }

        // For exam mode, allow custom number but suggest 100
        if (selectedMode !== "exam" && num > maxQuestions) {
            toast({
                title: "Too Many Questions",
                description: `Please enter a number less than or equal to ${maxQuestions}.`,
                variant: "destructive",
            });
            return;
        }

        onStartQuiz(num, selectedMode);
    };

    const isSetupDisabled = !hasFilesAvailable || isLoading || (selectedMode !== "exam" && (!hasLoadedQuestions || maxQuestions === 0));
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
            <CardContent className="space-y-4 p-3 md:p-4">
                <div className="space-y-1">
                    <Label htmlFor="numQuestions" className="text-md md:text-lg font-medium">Number of Questions:</Label>
                    <Input
                        id="numQuestions"
                        type="number"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(e.target.value)}
                        min="1"
                        max={selectedMode === "exam" ? undefined : (maxQuestions > 0 ? maxQuestions : undefined)}
                        className="text-sm md:text-base bg-card border-primary/50 focus:border-primary focus:ring-primary"
                        data-ai-hint="number input"
                        disabled={isSetupDisabled}
                    />
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {selectedMode === "exam"
                            ? "(Recommended: 100 questions from all files)"
                            : hasFilesAvailable && hasLoadedQuestions && maxQuestions > 0
                                ? `(Max: ${maxQuestions})`
                                : hasFilesAvailable && isLoading
                                    ? "(Loading questions...)"
                                    : hasFilesAvailable && !hasLoadedQuestions
                                        ? "(No questions in selected file)"
                                        : "(No quiz files available)"}
                    </p>
                </div>
                <div className="space-y-2">
                    <Label className="text-md md:text-lg font-medium">Select Mode:</Label>
                    <RadioGroup
                        value={selectedMode}
                        onValueChange={(value: string) => setSelectedMode(value as QuizMode)}
                        className="flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0 items-start sm:items-center"
                        disabled={isSetupDisabled}
                    >
                        <div className="flex items-center space-x-1.5 p-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60">
                            <RadioGroupItem value="testing" id="mode-testing" disabled={isSetupDisabled} />
                            <Label htmlFor="mode-testing" className={`flex items-center cursor-pointer text-sm md:text-base ${isSetupDisabled ? 'cursor-not-allowed' : ''}`}>
                                <CheckSquareIcon className="mr-1.5 h-4 w-4 md:h-5 md:w-5 text-primary" /> Testing Mode
                            </Label>
                        </div>
                        <div className="flex items-center space-x-1.5 p-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60">
                            <RadioGroupItem value="learning" id="mode-learning" disabled={isSetupDisabled} />
                            <Label htmlFor="mode-learning" className={`flex items-center cursor-pointer text-sm md:text-base ${isSetupDisabled ? 'cursor-not-allowed' : ''}`}>
                                <GraduationCap className="mr-1.5 h-4 w-4 md:h-5 md:w-5 text-accent" /> Learning Mode
                            </Label>
                        </div>
                        <div className="flex items-center space-x-1.5 p-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60">
                            <RadioGroupItem value="exam" id="mode-exam" disabled={!hasFilesAvailable} />
                            <Label htmlFor="mode-exam" className={`flex items-center cursor-pointer text-sm md:text-base ${!hasFilesAvailable ? 'cursor-not-allowed' : ''}`}>
                                <Rocket className="mr-1.5 h-4 w-4 md:h-5 md:w-5 text-green-500" /> Exam Mode
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
            </CardContent>
            <CardFooter className="p-3 md:p-4 justify-center">
                <Button
                    onClick={handleStart}
                    className="text-md md:text-lg py-2.5 md:py-3"
                    disabled={isButtonDisabled}
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    ) : (
                        <Rocket className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    )}
                    {isLoading ? "Loading..." : "Start Quiz"}
                </Button>
            </CardFooter>
        </Card>
    );
}
