"use client";

import type { Question } from "@/lib/quiz-data";
import type { QuizMode } from "@/app/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { getTranslations, type Language } from "@/lib/i18n";

interface QuestionDisplayCardProps {
  question: Question;
  selectedOption: number | null;
  onOptionSelect: (optionIndex: number) => void;
  questionNumber: number;
  totalQuestions: number;
  quizMode: QuizMode;
  language: Language;
}

export default function QuestionDisplayCard({
  question,
  selectedOption,
  onOptionSelect,
  questionNumber,
  totalQuestions,
  quizMode,
  language,
}: QuestionDisplayCardProps) {
  const t = getTranslations(language);
  const hasBeenAnswered = selectedOption !== null;
  const isRadioGroupDisabled = quizMode === 'learning' && hasBeenAnswered;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <CardTitle className="text-base font-semibold text-primary sm:text-lg">
          {t.question} {questionNumber} <span className="text-sm font-normal text-muted-foreground">{t.of} {totalQuestions}</span>
        </CardTitle>
        <CardDescription className="min-h-[2.5em] text-base leading-7 !text-card-foreground sm:text-lg">
          {question.question}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <RadioGroup
          value={selectedOption !== null ? selectedOption.toString() : undefined}
          onValueChange={(value) => onOptionSelect(parseInt(value))}
          className="space-y-3"
          disabled={isRadioGroupDisabled}
        >
          {question.options.map((option, index) => {
            const isThisOptionSelected = selectedOption === index;
            const isCorrectAnswer = question.correctAnswerIndex === index;
            
            let optionStyle = "border-border hover:bg-primary/10 text-card-foreground";
            let icon = null;

            if (quizMode === 'learning' && hasBeenAnswered) {
              if (isCorrectAnswer) {
                optionStyle = "bg-correct-answer text-correct-answer-foreground border-correct-answer ring-2 ring-correct-answer";
                icon = <CheckCircle className="mr-2 h-4 w-4 md:h-5 md:w-5 text-correct-answer-foreground" />;
              } else if (isThisOptionSelected && !isCorrectAnswer) {
                optionStyle = "bg-incorrect-answer text-incorrect-answer-foreground border-incorrect-answer ring-2 ring-incorrect-answer";
                icon = <XCircle className="mr-2 h-4 w-4 md:h-5 md:w-5 text-incorrect-answer-foreground" />;
              } else {
                // Other options in learning mode after an answer is given (and they are not the correct one)
                optionStyle = "border-border opacity-60 text-card-foreground";
              }
            } else { // Testing mode or Learning mode before an answer
              if (isThisOptionSelected) {
                optionStyle = "bg-primary/20 border-primary ring-2 ring-primary text-card-foreground";
              }
            }

            return (
              <Label
                key={index}
                htmlFor={`option-${question.id}-${index}`}
                className={`flex min-h-14 items-center space-x-3 rounded-md border p-3.5 cursor-pointer transition-all duration-200 ease-in-out
                  ${optionStyle}
                  ${isRadioGroupDisabled ? 'cursor-not-allowed opacity-80' : ''}
                `}
              >
                <RadioGroupItem 
                  value={index.toString()} 
                  id={`option-${question.id}-${index}`} 
                  className={`border-primary/70 text-primary focus:ring-primary 
                    ${quizMode === 'learning' && hasBeenAnswered && isCorrectAnswer ? 'border-correct-answer text-correct-answer-foreground' : ''}
                    ${quizMode === 'learning' && hasBeenAnswered && isThisOptionSelected && !isCorrectAnswer ? 'border-incorrect-answer text-incorrect-answer-foreground' : ''}
                  `} 
                  disabled={isRadioGroupDisabled}
                />
                {quizMode === 'learning' && hasBeenAnswered && icon}
                <span className="flex-grow text-sm leading-6 sm:text-base">{option}</span>
              </Label>
            );
          })}
        </RadioGroup>
         {quizMode === 'learning' && hasBeenAnswered && selectedOption !== question.correctAnswerIndex && (
          <p className="mt-3 p-2 rounded-md bg-correct-answer/20 text-correct-answer-foreground border border-correct-answer text-xs md:text-sm">
            {t.correctAnswer}: {question.options[question.correctAnswerIndex]}
          </p>
        )}
          {quizMode === 'learning' && hasBeenAnswered && selectedOption !== question.correctAnswerIndex && question.source && (
            <p className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs text-muted-foreground md:text-sm">
              {t.sourceReference}: {question.source}
            </p>
          )}
      </CardContent>
    </Card>
  );
}
