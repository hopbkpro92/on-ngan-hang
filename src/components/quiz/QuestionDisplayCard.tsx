"use client";

import type { Question } from "@/lib/quiz-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuestionDisplayCardProps {
  question: Question;
  selectedOption: number | null;
  onOptionSelect: (optionIndex: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionDisplayCard({
  question,
  selectedOption,
  onOptionSelect,
  questionNumber,
  totalQuestions,
}: QuestionDisplayCardProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-semibold">
          Question {questionNumber} <span className="text-sm text-muted-foreground">of {totalQuestions}</span>
        </CardTitle>
        <CardDescription className="text-lg pt-2 !text-card-foreground min-h-[3em]">
          {question.question}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedOption !== null ? selectedOption.toString() : undefined}
          onValueChange={(value) => onOptionSelect(parseInt(value))}
          className="space-y-3"
        >
          {question.options.map((option, index) => (
            <Label
              key={index}
              htmlFor={`option-${question.id}-${index}`}
              className={`flex items-center space-x-3 p-4 rounded-md border cursor-pointer transition-all duration-200 ease-in-out
                ${selectedOption === index 
                  ? 'bg-primary/20 border-primary ring-2 ring-primary' 
                  : 'hover:bg-primary/10 border-border'}
                text-card-foreground`}
            >
              <RadioGroupItem value={index.toString()} id={`option-${question.id}-${index}`} className="border-primary/70 text-primary focus:ring-primary"/>
              <span className="text-base">{option}</span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
