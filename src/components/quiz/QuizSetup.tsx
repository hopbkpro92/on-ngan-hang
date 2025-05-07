"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizSetupProps {
  onStartQuiz: (numQuestions: number) => void;
  maxQuestions: number;
  isLoading?: boolean; // True if questions for the current file are loading
  hasLoadedQuestions?: boolean;
  hasFilesAvailable?: boolean;
}

export default function QuizSetup({ 
  onStartQuiz, 
  maxQuestions, 
  isLoading = false, 
  hasLoadedQuestions = false,
  hasFilesAvailable = false
}: QuizSetupProps) {
  const [numQuestions, setNumQuestions] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (maxQuestions > 0) {
      setNumQuestions(Math.min(10, maxQuestions).toString()); // Default to 10 or max available
    } else {
      setNumQuestions("0");
    }
  }, [maxQuestions]);

  const handleStart = () => {
    if (!hasFilesAvailable) {
      toast({
        title: "No Quiz Files Available",
        description: "Please add Excel files to the 'public' folder and refresh.",
        variant: "destructive",
      });
      return;
    }
    if (!hasLoadedQuestions || maxQuestions === 0) {
       toast({
        title: "No Questions Loaded",
        description: "The selected file might be empty or incorrectly formatted. Try another file.",
        variant: "destructive",
      });
      return;
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
    if (num > maxQuestions) {
      toast({
        title: "Too Many Questions",
        description: `Please enter a number less than or equal to ${maxQuestions}.`,
        variant: "destructive",
      });
      return;
    }
    onStartQuiz(num);
  };

  const isSetupDisabled = !hasFilesAvailable || isLoading || !hasLoadedQuestions || maxQuestions === 0;
  const isButtonDisabled = isSetupDisabled || parseInt(numQuestions) <=0 || isNaN(parseInt(numQuestions));

  let descriptionText = "Test your knowledge. Choose how many questions you'd like to tackle.";
  if (!hasFilesAvailable) {
    descriptionText = "No quiz files found. Please add Excel files to the public folder.";
  } else if (isLoading) {
    descriptionText = "Loading questions from the selected file...";
  } else if (!hasLoadedQuestions && hasFilesAvailable) {
    descriptionText = "No questions found in the selected file, or it's still loading. Please check the file or select another.";
  }


  return (
    <Card className={`w-full shadow-xl ${isLoading ? 'opacity-70' : ''}`}>
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Quiz Whiz Challenge!</CardTitle>
        <CardDescription className="text-center text-muted-foreground min-h-[2em]">
          {descriptionText}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="numQuestions" className="text-lg font-medium">Number of Questions:</Label>
          <Input
            id="numQuestions"
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            min="1"
            max={maxQuestions > 0 ? maxQuestions : undefined}
            className="text-base bg-card border-primary/50 focus:border-primary focus:ring-primary"
            data-ai-hint="number input"
            disabled={!hasFilesAvailable || isLoading || !hasLoadedQuestions}
          />
           <p className="text-sm text-muted-foreground">
            {hasFilesAvailable && hasLoadedQuestions && maxQuestions > 0 ? `(Max: ${maxQuestions})` 
            : hasFilesAvailable && isLoading ? "(Loading questions...)"
            : hasFilesAvailable && !hasLoadedQuestions ? "(No questions in selected file)"
            : "(No quiz files available)"}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleStart} 
          className="w-full text-lg py-6" 
          disabled={isButtonDisabled}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "Loading..." : "Start Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
}
