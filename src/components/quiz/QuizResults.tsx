"use client";

import type { Question } from "@/lib/quiz-data";
import type { QuizMode } from "@/app/page";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw, Award, GraduationCap, PartyPopper, Heart, Sparkles, RotateCcw } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getTranslations, type Language } from "@/lib/i18n";
import { getPracticeFeedback } from "@/lib/quiz-feedback";
import { playCelebrationSound } from "@/lib/quiz-sound";
import { useEffect } from "react";

interface QuizResultsProps {
  questions: Question[];
  userAnswers: (number | null)[];
  onRetakeQuiz: () => void;
  onRetakeSameQuiz: () => void;
  onReviewIncorrect: () => void;
  onReviewStoredIncorrect: () => void;
  storedWrongCount: number;
  quizMode: QuizMode;
  language: Language;
}

export default function QuizResults({ questions, userAnswers, onRetakeQuiz, onRetakeSameQuiz, onReviewIncorrect, onReviewStoredIncorrect, storedWrongCount, quizMode, language }: QuizResultsProps) {
  const t = getTranslations(language);
  let correctCount = 0;
  userAnswers.forEach((answer, index) => {
    if (answer !== null && answer === questions[index].correctAnswerIndex) {
      correctCount++;
    }
  });
  const wrongCount = questions.length - correctCount;
  const scorePercentage = Math.round((correctCount / questions.length) * 100);

  const titleText = quizMode === "learning" ? t.resultsLearning : t.resultsQuiz;
  const Icon = quizMode === "learning" ? GraduationCap : Award;
  const practiceFeedback = quizMode === "testing" || quizMode === "challenge" ? getPracticeFeedback(scorePercentage) : "none";

  useEffect(() => {
    const soundEnabled = window.localStorage.getItem("quiz-sound-enabled") !== "false";
    if (practiceFeedback === "praise") {
      playCelebrationSound(soundEnabled);
    }
  }, [practiceFeedback]);

  return (
    <Card className="mx-auto w-full animate-fadeIn shadow-xl">
      <CardHeader className="p-4 text-center sm:p-6">
        <CardTitle className="text-2xl font-bold sm:text-3xl">{titleText}</CardTitle>
        <Icon className="mx-auto my-4 h-14 w-14 text-primary sm:h-16 sm:w-16" />
        <CardDescription className="text-base sm:text-xl">
          {t.scored} {correctCount} {t.of} {questions.length} ({scorePercentage}%)
        </CardDescription>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2">
          <span className="flex items-center text-base font-semibold text-correct-answer sm:text-lg">
            <CheckCircle className="mr-1 h-4 w-4 md:h-5 md:w-5" /> {t.correct}: {correctCount}
          </span>
          <span className="flex items-center text-base font-semibold text-incorrect-answer sm:text-lg">
            <XCircle className="mr-1 h-4 w-4 md:h-5 md:w-5" /> {t.wrong}: {wrongCount}
          </span>
        </div>
        {practiceFeedback !== "none" && (
          <div className={`relative mx-auto mt-5 flex max-w-xl items-center justify-center gap-3 overflow-hidden rounded-md border px-4 py-3 text-sm font-medium sm:text-base ${practiceFeedback === "praise" ? "animate-praise-banner border-correct-answer/50 bg-correct-answer/15 text-green-900 shadow-[0_0_22px_hsl(var(--correct-answer-bg)/0.28)] dark:text-green-100" : "animate-feedback-pop border-accent/50 bg-accent/15 text-foreground"}`}>
            {practiceFeedback === "praise" ? (
              <>
                <span className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-correct-answer/50 animate-praise-ring" />
                <Sparkles className="pointer-events-none absolute left-8 top-1 h-4 w-4 animate-praise-burst text-accent" />
                <Sparkles className="pointer-events-none absolute right-8 bottom-1 h-4 w-4 animate-praise-burst text-primary [animation-delay:120ms]" />
                <Sparkles className="pointer-events-none absolute left-20 bottom-1 h-3 w-3 animate-praise-burst text-accent [animation-delay:220ms]" />
                <PartyPopper className="relative z-10 h-6 w-6 shrink-0 animate-praise-wiggle" />
              </>
            ) : (
              <Heart className="h-6 w-6 shrink-0 animate-pulse" />
            )}
            {practiceFeedback === "praise"
              ? t.practicePraise.replace("{percent}", String(scorePercentage))
              : t.practiceEncouragement}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <h3 className="mb-4 text-center text-lg font-semibold text-card-foreground sm:text-xl">
          {quizMode === 'learning' ? t.reviewLearning : t.reviewAnswers}
        </h3>
        <Accordion type="single" collapsible className="w-full">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswerIndex;
            return (
              <AccordionItem value={`item-${index}`} key={question.id} className="mb-2 rounded-md border border-border bg-card">
                <AccordionTrigger className={`rounded-t-md p-3 text-left text-sm hover:no-underline sm:text-base ${
                    isCorrect ? 'text-correct-answer' : 'text-incorrect-answer'
                  }`}>
                  <div className="flex items-center w-full">
                    {isCorrect ? (
                      <CheckCircle className="mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                    )}
                    <span className="flex-grow text-card-foreground">{index + 1}. {question.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="rounded-b-md bg-card p-3 text-card-foreground sm:p-4">
                  <ul className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className={`rounded-md p-2.5 text-sm leading-5
                          ${optionIndex === question.correctAnswerIndex ? 'quiz-correct-answer font-semibold' : ''}
                          ${optionIndex === userAnswer && !isCorrect ? 'bg-destructive/30 quiz-incorrect-answer-highlight' : ''}
                          ${optionIndex !== question.correctAnswerIndex && optionIndex !== userAnswer ? 'border border-muted' : ''}
                          `}
                      >
                        {option}
                        {optionIndex === userAnswer && !isCorrect && (
                          <span className="ml-2 text-xs font-normal">({t.yourAnswer})</span>
                        )}
                        {optionIndex === question.correctAnswerIndex && userAnswer !== null && optionIndex !== userAnswer && (
                           <span className="ml-2 text-xs font-normal">({t.correctAnswerLabel})</span>
                        )}
                         {optionIndex === question.correctAnswerIndex && userAnswer === null && (
                           <span className="ml-2 text-xs font-normal">({t.correctNotAnswered})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {userAnswer === null && <p className="mt-1.5 text-xs text-muted-foreground md:mt-2 md:text-sm">{t.notAnswered}</p>}
                  {!isCorrect && question.source && (
                    <p className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs text-muted-foreground md:text-sm">
                      {t.sourceReference}: {question.source}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-4 pt-0 sm:flex-row sm:justify-center sm:p-6 sm:pt-0">
        {wrongCount > 0 && (
          <Button onClick={onReviewIncorrect} variant="outline" className="h-11 w-full text-base sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t.reviewIncorrect}
          </Button>
        )}
        {storedWrongCount > 0 && (
          <Button onClick={onReviewStoredIncorrect} variant="outline" className="h-11 w-full text-base sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t.reviewSavedIncorrect} ({storedWrongCount})
          </Button>
        )}
        <Button onClick={onRetakeSameQuiz} variant="outline" className="h-11 w-full text-base sm:w-auto">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t.retakeSameQuestions}
        </Button>
        <Button onClick={onRetakeQuiz} className="h-11 w-full text-base sm:w-auto sm:px-8">
          <RefreshCw className="mr-2 h-4 w-4 md:h-5 md:w-5" />
          {quizMode === "learning" ? t.newLearning : t.retake}
        </Button>
      </CardFooter>
    </Card>
  );
}
