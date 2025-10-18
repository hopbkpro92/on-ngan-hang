"use client";

import { useState, useEffect, useRef } from "react";
import type { Question } from "@/lib/quiz-data";
import type { QuizMode } from "@/app/page";
import QuestionDisplayCard from "./QuestionDisplayCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, CheckSquare, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuizAreaProps {
  questions: Question[];
  onQuizComplete: (answers: (number | null)[]) => void;
  quizMode: QuizMode;
}

export default function QuizArea({ questions, onQuizComplete, quizMode }: QuizAreaProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
        () => Array(questions.length).fill(null) // Initialize based on initial questions length
    );
    const [showNext, setShowNext] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(120 * 60); // 120 minutes in seconds
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const autoSubmitRef = useRef<boolean>(false);

    // Effect to reset selectedAnswers when the questions array itself changes (e.g., new quiz started)
    useEffect(() => {
        setSelectedAnswers(Array(questions.length).fill(null));
        setCurrentQuestionIndex(0); // Reset to first question
        setTimeRemaining(120 * 60); // Reset timer to 120 minutes
        autoSubmitRef.current = false;
    }, [questions]);

    useEffect(() => {
        setShowNext(false);
        const timer = setTimeout(() => setShowNext(true), 50);
        return () => clearTimeout(timer);
    }, [currentQuestionIndex]);

    // Timer effect for exam mode
    useEffect(() => {
        if (quizMode !== "exam") {
            return;
        }

        // Start the countdown timer
        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    // Time's up - auto submit
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                    if (!autoSubmitRef.current) {
                        autoSubmitRef.current = true;
                        setTimeout(() => {
                            onQuizComplete(selectedAnswers);
                        }, 100);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Cleanup on unmount
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [quizMode, onQuizComplete, selectedAnswers]);

    const handleOptionSelect = (optionIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setSelectedAnswers(newAnswers);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmitQuiz = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        onQuizComplete(selectedAnswers);
    };

    const progressValue = ((currentQuestionIndex + 1) / questions.length) * 100;

    // Format time as HH:MM:SS
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Determine timer color based on remaining time
    const getTimerColor = (): string => {
        if (timeRemaining <= 5 * 60) return "text-red-600 dark:text-red-400"; // Last 5 minutes - Critical
        if (timeRemaining <= 15 * 60) return "text-amber-600 dark:text-amber-400"; // Last 15 minutes - Warning
        return "text-blue-600 dark:text-blue-400"; // Normal - Clear and visible
    };

    if (!questions || questions.length === 0) {
        return <p>No questions available for the quiz.</p>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentSelectedOption = selectedAnswers[currentQuestionIndex];

    return (
        <div className="w-full space-y-6 mx-auto">
            {quizMode === "exam" && (
                <Alert className="border-2">
                    <Clock className="h-2 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span className="font-medium">Time Remaining:</span>
                        <span className={`text-2xl font-bold tabular-nums ${getTimerColor()}`}>
                            {formatTime(timeRemaining)}
                        </span>
                    </AlertDescription>
                </Alert>
            )}
            <Progress value={progressValue} className="w-full h-2 mb-1" />
            <div className={showNext ? 'animate-fadeIn' : 'opacity-0'}>
                <QuestionDisplayCard
                    key={`${currentQuestion.id}-${quizMode}-${currentQuestionIndex}`}
                    question={currentQuestion}
                    selectedOption={currentSelectedOption}
                    onOptionSelect={handleOptionSelect}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                    quizMode={quizMode}
                />
            </div>

            <div className="flex justify-between items-center pt-3">
                <div className="text-xs md:text-sm text-muted-foreground">
                    Answered: {selectedAnswers.filter(ans => ans !== null).length} / {questions.length}
                </div>
                <div className="flex gap-2">
                    {(quizMode === "testing" || quizMode === "exam") && currentQuestionIndex > 0 && (
                        <Button
                            onClick={handlePreviousQuestion}
                            size="default"
                            variant="outline"
                        >
                            <ChevronLeft className="h-6 w-6" strokeWidth={3} />
                        </Button>
                    )}
                    {currentQuestionIndex < questions.length - 1 ? (
                        <Button
                            onClick={handleNextQuestion}
                            disabled={currentSelectedOption === null}
                            size="default"
                            variant="outline"
                        >
                            <ChevronRight className="h-6 w-6" strokeWidth={3} />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmitQuiz}
                            disabled={selectedAnswers.some(ans => ans === null)}
                            size="default"
                            variant="outline"
                        >
                            Submit <CheckSquare className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
