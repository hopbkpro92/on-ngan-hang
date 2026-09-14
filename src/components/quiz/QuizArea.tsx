"use client";

import { useState, useEffect, useRef } from "react";
import type { Question } from "@/lib/quiz-data";
import type { QuizMode } from "@/app/page";
import QuestionDisplayCard from "./QuestionDisplayCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, CheckSquare, Clock, LogOut, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTranslations, type Language } from "@/lib/i18n";
import { getLearningFeedback } from "@/lib/quiz-feedback";
import { playCelebrationSound } from "@/lib/quiz-sound";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface QuizAreaProps {
  questions: Question[];
  onQuizComplete: (answers: (number | null)[]) => void;
  quizMode: QuizMode;
  onExit?: () => void;
    language: Language;
}

export default function QuizArea({ questions, onQuizComplete, quizMode, onExit, language }: QuizAreaProps) {
    const t = getTranslations(language);
    const examDurationSeconds = 90 * 60;
    const challengeDurationSeconds = 60;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
        () => Array(questions.length).fill(null) // Initialize based on initial questions length
    );
    const [showNext, setShowNext] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(examDurationSeconds);
    const [learningStreak, setLearningStreak] = useState(0);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [feedbackTone, setFeedbackTone] = useState<"positive" | "encouragement">("positive");
    const [soundEnabled, setSoundEnabled] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const autoSubmitRef = useRef<boolean>(false);

    const handleExit = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        if (onExit) {
            onExit();
        }
    };

    // Effect to reset selectedAnswers when the questions array itself changes (e.g., new quiz started)
    useEffect(() => {
        setSelectedAnswers(Array(questions.length).fill(null));
        setCurrentQuestionIndex(0); // Reset to first question
        setTimeRemaining(quizMode === "challenge" ? challengeDurationSeconds : examDurationSeconds);
        setLearningStreak(0);
        setFeedbackMessage(null);
        autoSubmitRef.current = false;
    }, [questions]);

    useEffect(() => {
        const savedSoundPreference = window.localStorage.getItem("quiz-sound-enabled");
        if (savedSoundPreference !== null) {
            setSoundEnabled(savedSoundPreference === "true");
        }
    }, []);

    useEffect(() => {
        setShowNext(false);
        setFeedbackMessage(null);
        const timer = setTimeout(() => setShowNext(true), 50);
        return () => clearTimeout(timer);
    }, [currentQuestionIndex]);

    const playFeedbackSound = (isCorrect: boolean) => {
        if (!soundEnabled || typeof window === "undefined") {
            return;
        }

        const AudioContextConstructor = window.AudioContext ||
            (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) {
            return;
        }

        const audioContext = new AudioContextConstructor();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "sine";
        const shouldRevealAnswer = quizMode === "learning";
        oscillator.frequency.value = shouldRevealAnswer
            ? (isCorrect ? 660 : 220)
            : 440;
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        oscillator.addEventListener("ended", () => void audioContext.close());
    };

    const toggleSound = () => {
        setSoundEnabled((enabled) => {
            const nextEnabled = !enabled;
            window.localStorage.setItem("quiz-sound-enabled", String(nextEnabled));
            return nextEnabled;
        });
    };

    // Timer effect for exam mode
    useEffect(() => {
        if (quizMode !== "exam" && quizMode !== "challenge") {
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
        const previousAnswer = selectedAnswers[currentQuestionIndex];
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setSelectedAnswers(newAnswers);

        if (previousAnswer !== null) {
            return;
        }

        const isCorrect = optionIndex === questions[currentQuestionIndex].correctAnswerIndex;
        playFeedbackSound(isCorrect);

        if (quizMode === "learning") {
            const nextStreak = isCorrect ? learningStreak + 1 : 0;
            setLearningStreak(nextStreak);
            const feedback = getLearningFeedback(nextStreak, isCorrect);

            if (feedback === "streak3" || feedback === "streak5" || feedback === "streak10") {
                setFeedbackTone("positive");
                const streakMessage = feedback === "streak3"
                    ? t.streak3
                    : feedback === "streak5"
                        ? t.streak5
                        : t.streak10;
                setFeedbackMessage(streakMessage.replace("{count}", String(nextStreak)));
                playCelebrationSound(soundEnabled);
            } else if (feedback === "encouragement") {
                setFeedbackTone("encouragement");
                setFeedbackMessage(t.learningEncouragement);
            } else {
                setFeedbackMessage(null);
            }
            return;
        }

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
        <div className="mx-auto w-full space-y-5">
            {(quizMode === "exam" || quizMode === "challenge") && (
                <Alert className="border-primary/20 bg-card shadow-sm">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium sm:text-base">{quizMode === "challenge" ? t.quickChallengeTime : t.timeRemaining}</span>
                        <span className={`text-xl font-bold tabular-nums sm:text-2xl ${getTimerColor()}`}>
                            {formatTime(timeRemaining)}
                        </span>
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex items-center gap-3">
                <Progress value={progressValue} className="h-2 flex-1" />
                <span className="shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">
                    {currentQuestionIndex + 1}/{questions.length}
                </span>
            </div>
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleSound}
                    aria-label={soundEnabled ? t.soundOn : t.soundOff}
                    title={soundEnabled ? t.soundOn : t.soundOff}
                >
                    {soundEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                    {soundEnabled ? t.soundOn : t.soundOff}
                </Button>
            </div>
            <div className={showNext ? 'animate-fadeIn' : 'opacity-0'}>
                    <QuestionDisplayCard
                    key={`${currentQuestion.id}-${quizMode}-${currentQuestionIndex}`}
                    question={currentQuestion}
                    selectedOption={currentSelectedOption}
                    onOptionSelect={handleOptionSelect}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                    quizMode={quizMode}
                    language={language}
                />
            </div>
            {feedbackMessage && (
                <div className={`relative flex items-center gap-3 overflow-hidden rounded-md border px-4 py-3 text-sm font-medium ${feedbackTone === "positive" ? "animate-praise-banner border-correct-answer/50 bg-correct-answer/15 text-green-900 shadow-[0_0_22px_hsl(var(--correct-answer-bg)/0.28)] dark:text-green-100" : "animate-feedback-pop border-accent/50 bg-accent/15 text-foreground"}`}>
                    {feedbackTone === "positive" && (
                        <>
                            <span className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-correct-answer/50 animate-praise-ring" />
                            <Sparkles className="pointer-events-none absolute right-8 top-1 h-4 w-4 animate-praise-burst text-accent" />
                            <Sparkles className="pointer-events-none absolute bottom-1 right-20 h-3 w-3 animate-praise-burst text-primary [animation-delay:120ms]" />
                            <Sparkles className="pointer-events-none absolute left-16 bottom-1 h-3 w-3 animate-praise-burst text-accent [animation-delay:220ms]" />
                        </>
                    )}
                    <Sparkles className={`relative z-10 h-5 w-5 shrink-0 ${feedbackTone === "positive" ? "animate-praise-wiggle" : "animate-pulse"}`} />
                    {feedbackMessage}
                </div>
            )}

            <div className="flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-3 sm:justify-start">
                    {onExit && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="default" 
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    {t.exitQuiz}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t.exitTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>{t.exitDescription}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t.continueQuiz}</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleExit}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {t.yesExit}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <div className="text-xs md:text-sm text-muted-foreground">
                        {t.answered}: {selectedAnswers.filter(ans => ans !== null).length} / {questions.length}
                    </div>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                    {(quizMode === "testing" || quizMode === "exam" || quizMode === "challenge") && currentQuestionIndex > 0 && (
                        <Button
                            onClick={handlePreviousQuestion}
                            size="default"
                            variant="outline"
                            className="flex-1 sm:flex-none"
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
                            className="flex-1 sm:flex-none"
                        >
                            <ChevronRight className="h-6 w-6" strokeWidth={3} />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmitQuiz}
                            disabled={selectedAnswers.some(ans => ans === null)}
                            size="default"
                            variant="outline"
                            className="flex-1 sm:flex-none"
                        >
                            {t.submit} <CheckSquare className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
