"use client";

import { useState, useEffect } from "react";
import type { Question } from "@/lib/quiz-data";
import QuestionDisplayCard from "./QuestionDisplayCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckSquare } from "lucide-react";

interface QuizAreaProps {
  questions: Question[];
  onQuizComplete: (answers: (number | null)[]) => void;
}

export default function QuizArea({ questions, onQuizComplete }: QuizAreaProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [showNext, setShowNext] = useState(false); // For animation control

  useEffect(() => {
    // Trigger fade-in animation for new question
    setShowNext(false);
    const timer = setTimeout(() => setShowNext(true), 50); // short delay to ensure class change is picked up
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);


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

  const handleSubmitQuiz = () => {
    onQuizComplete(selectedAnswers);
  };

  const progressValue = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!questions || questions.length === 0) {
    return <p>No questions available for the quiz.</p>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="w-full max-w-2xl space-y-8">
       <Progress value={progressValue} className="w-full h-3 mb-2" />
       <div className={showNext ? 'animate-fadeIn' : 'opacity-0'}>
        <QuestionDisplayCard
          key={currentQuestion.id}
          question={currentQuestion}
          selectedOption={selectedAnswers[currentQuestionIndex]}
          onOptionSelect={handleOptionSelect}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />
       </div>
      
      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-muted-foreground">
          Answered: {selectedAnswers.filter(ans => ans !== null).length} / {questions.length}
        </div>
        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={handleNextQuestion} disabled={selectedAnswers[currentQuestionIndex] === null} size="lg">
            Next Question <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button onClick={handleSubmitQuiz} disabled={selectedAnswers.some(ans => ans === null)} size="lg" variant="default">
            Submit Quiz <CheckSquare className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
