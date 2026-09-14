"use client";

import type { Question } from "@/lib/quiz-data";
import type { QuizMode } from "@/app/page";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw, Award, GraduationCap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getTranslations, type Language } from "@/lib/i18n";

interface QuizResultsProps {
  questions: Question[];
  userAnswers: (number | null)[];
  onRetakeQuiz: () => void;
  quizMode: QuizMode;
  language: Language;
}

export default function QuizResults({ questions, userAnswers, onRetakeQuiz, quizMode, language }: QuizResultsProps) {
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
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      <CardFooter className="p-4 pt-0 sm:p-6 sm:pt-0">
        <Button onClick={onRetakeQuiz} className="h-11 w-full text-base sm:w-auto sm:px-8">
          <RefreshCw className="mr-2 h-4 w-4 md:h-5 md:w-5" />
          {quizMode === "learning" ? t.newLearning : t.retake}
        </Button>
      </CardFooter>
    </Card>
  );
}
