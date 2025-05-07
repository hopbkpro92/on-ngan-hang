"use client";

import type { Question } from "@/lib/quiz-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw, Award } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface QuizResultsProps {
  questions: Question[];
  userAnswers: (number | null)[];
  onRetakeQuiz: () => void;
}

export default function QuizResults({ questions, userAnswers, onRetakeQuiz }: QuizResultsProps) {
  let correctCount = 0;
  userAnswers.forEach((answer, index) => {
    if (answer !== null && answer === questions[index].correctAnswerIndex) {
      correctCount++;
    }
  });
  const wrongCount = questions.length - correctCount;
  const scorePercentage = Math.round((correctCount / questions.length) * 100);

  return (
    <Card className="w-full max-w-3xl shadow-xl animate-fadeIn">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Quiz Completed!</CardTitle>
        <Award className="mx-auto h-16 w-16 text-primary my-4" />
        <CardDescription className="text-xl">
          You scored {correctCount} out of {questions.length} ({scorePercentage}%)
        </CardDescription>
        <div className="flex justify-center gap-4 mt-2">
          <span className="text-lg text-correct-answer-DEFAULT font-semibold flex items-center">
            <CheckCircle className="mr-1 h-5 w-5" /> Correct: {correctCount}
          </span>
          <span className="text-lg text-incorrect-answer-DEFAULT font-semibold flex items-center">
            <XCircle className="mr-1 h-5 w-5" /> Wrong: {wrongCount}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-xl font-semibold mb-4 text-center text-card-foreground">Review Your Answers:</h3>
        <Accordion type="single" collapsible className="w-full">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswerIndex;
            return (
              <AccordionItem value={`item-${index}`} key={question.id} className="mb-2 border border-border rounded-md bg-card">
                <AccordionTrigger className={`p-4 text-left hover:no-underline rounded-t-md ${
                    isCorrect ? 'text-correct-answer-DEFAULT' : 'text-incorrect-answer-DEFAULT'
                  }`}>
                  <div className="flex items-center w-full">
                    {isCorrect ? (
                      <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0" />
                    ) : (
                      <XCircle className="mr-3 h-5 w-5 flex-shrink-0" />
                    )}
                    <span className="flex-grow text-card-foreground">{index + 1}. {question.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 text-card-foreground bg-card rounded-b-md">
                  <ul className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className={`p-3 rounded-md text-sm
                          ${optionIndex === question.correctAnswerIndex ? 'quiz-correct-answer font-semibold' : ''}
                          ${optionIndex === userAnswer && !isCorrect ? 'bg-destructive/30 quiz-incorrect-answer-highlight' : ''}
                          ${optionIndex !== question.correctAnswerIndex && optionIndex !== userAnswer ? 'border border-muted' : ''}
                          `}
                      >
                        {option}
                        {optionIndex === userAnswer && !isCorrect && (
                          <span className="ml-2 text-xs font-normal">(Your answer)</span>
                        )}
                        {optionIndex === question.correctAnswerIndex && !isCorrect && (
                           <span className="ml-2 text-xs font-normal">(Correct answer)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {userAnswer === null && <p className="mt-2 text-sm text-muted-foreground">You did not answer this question.</p>}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      <CardFooter>
        <Button onClick={onRetakeQuiz} className="w-full text-lg py-6">
          <RefreshCw className="mr-2 h-5 w-5" />
          Retake Quiz
        </Button>
      </CardFooter>
    </Card>
  );
}
