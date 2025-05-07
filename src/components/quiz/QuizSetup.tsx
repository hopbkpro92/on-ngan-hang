"use client";

import { useState, useEffect } from "react";
import type { QuizMode } from "@/app/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Rocket, Loader2, GraduationCap, CheckSquareIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizSetupProps {
  onStartQuiz: (numQuestions: number, mode: QuizMode) => void;
  maxQuestions: number;
  isLoading?: boolean; 
  hasLoadedQuestions?: boolean;
  hasFilesAvailable?: boolean;
  initialMode: QuizMode;
}

export default function QuizSetup({ 
  onStartQuiz, 
  maxQuestions, 
  isLoading = false, 
  hasLoadedQuestions = false,
  hasFilesAvailable = false,
  initialMode
}: QuizSetupProps) {
  const [numQuestions, setNumQuestions] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<QuizMode>(initialMode);
  const { toast } = useToast();

  useEffect(() => {
    if (maxQuestions > 0) {
      setNumQuestions(Math.min(10, maxQuestions).toString());
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
    onStartQuiz(num, selectedMode);
  };

  const isSetupDisabled = !hasFilesAvailable || isLoading || !hasLoadedQuestions || maxQuestions === 0;
  const isButtonDisabled = isSetupDisabled || parseInt(numQuestions) <=0 || isNaN(parseInt(numQuestions));

  let descriptionText = "Choose your mode and number of questions to test your knowledge.";
  if (!hasFilesAvailable) {
    descriptionText = "No quiz files found. Please add Excel files to the public folder.";
  } else if (isLoading) {
    descriptionText = "Loading questions from the selected file...";
  } else if (!hasLoadedQuestions && hasFilesAvailable) {
    descriptionText = "No questions found in the selected file. Please check the file or select another.";
  }


  return (
    <Card className={`w-full shadow-xl ${isLoading ? 'opacity-70' : ''}`}>
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Quiz Whiz Challenge!</CardTitle>
        <CardDescription className="text-center text-muted-foreground min-h-[2em]">
          {descriptionText}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            disabled={isSetupDisabled}
          />
           <p className="text-sm text-muted-foreground">
            {hasFilesAvailable && hasLoadedQuestions && maxQuestions > 0 ? `(Max: ${maxQuestions})` 
            : hasFilesAvailable && isLoading ? "(Loading questions...)"
            : hasFilesAvailable && !hasLoadedQuestions ? "(No questions in selected file)"
            : "(No quiz files available)"}
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-lg font-medium">Select Mode:</Label>
          <RadioGroup
            value={selectedMode}
            onValueChange={(value: string) => setSelectedMode(value as QuizMode)}
            className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 items-start sm:items-center"
            disabled={isSetupDisabled}
          >
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60">
              <RadioGroupItem value="testing" id="mode-testing" disabled={isSetupDisabled} />
              <Label htmlFor="mode-testing" className={`flex items-center cursor-pointer ${isSetupDisabled ? 'cursor-not-allowed' : ''}`}>
                <CheckSquareIcon className="mr-2 h-5 w-5 text-primary" /> Testing Mode
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60">
              <RadioGroupItem value="learning" id="mode-learning" disabled={isSetupDisabled} />
              <Label htmlFor="mode-learning" className={`flex items-center cursor-pointer ${isSetupDisabled ? 'cursor-not-allowed' : ''}`}>
                <GraduationCap className="mr-2 h-5 w-5 text-accent" /> Learning Mode
              </Label>
            </div>
          </RadioGroup>
           <p className="text-sm text-muted-foreground">
            Testing: Answers revealed at the end. Learning: Immediate feedback per question.
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
