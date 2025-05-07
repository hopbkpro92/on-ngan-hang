"use client";

import { useState, useEffect } from "react";
import type { Question } from "@/lib/quiz-data";
import type { QuizMode } from "@/app/page";
import QuestionDisplayCard from "./QuestionDisplayCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckSquare } from "lucide-react";

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

  // Effect to reset selectedAnswers when the questions array itself changes (e.g., new quiz started)
  useEffect(() => {
    setSelectedAnswers(Array(questions.length).fill(null));
    setCurrentQuestionIndex(0); // Reset to first question
  }, [questions]);


  useEffect(() => {
    setShowNext(false);
    const timer = setTimeout(() => setShowNext(true), 50); 
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
  const currentSelectedOption = selectedAnswers[currentQuestionIndex];

  return (
    <div className="w-full max-w-2xl space-y-8">
       <Progress value={progressValue} className="w-full h-3 mb-2" />
       <div className={showNext ? 'animate-fadeIn' : 'opacity-0'}>
        <QuestionDisplayCard
          key={`${currentQuestion.id}-${quizMode}`} // Add quizMode to key to force re-render if mode changes mid-quiz (though not typical)
          question={currentQuestion}
          selectedOption={currentSelectedOption}
          onOptionSelect={handleOptionSelect}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          quizMode={quizMode}
        />
       </div>
      
      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-muted-foreground">
          Answered: {selectedAnswers.filter(ans => ans !== null).length} / {questions.length}
        </div>
        {currentQuestionIndex < questions.length - 1 ? (
          <Button 
            onClick={handleNextQuestion} 
            disabled={currentSelectedOption === null} 
            size="lg"
          >
            Next Question <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmitQuiz} 
            disabled={selectedAnswers.some(ans => ans === null)} 
            size="lg" 
            variant="default"
          >
            Submit Quiz <CheckSquare className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
