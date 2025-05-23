
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Question } from "@/lib/quiz-data";
import { loadQuizData, listAvailableQuizFiles } from "@/lib/quiz-loader";
import QuizSetup from "@/components/quiz/QuizSetup";
import QuizArea from "@/components/quiz/QuizArea";
import QuizResults from "@/components/quiz/QuizResults";
import { Loader2, AlertTriangle, BookOpenText, FileText } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuizState = "setup" | "active" | "results";
export type QuizMode = "learning" | "testing";

export default function Home() {
  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [allLoadedQuestions, setAllLoadedQuestions] = useState<Question[]>([]);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>("testing");

  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    
    const initializeQuizData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const files = await listAvailableQuizFiles();
        setAvailableFiles(files);

        if (files.length > 0) {
          setSelectedFile(files[0]);
          // Question loading will be handled by the next useEffect
        } else {
          setError("No quiz files (.xlsx or .xls) found in the 'public' folder. Please add quiz files to use the application.");
          setAllLoadedQuestions([]); 
          setIsLoading(false); 
        }
      } catch (err) {
        console.error("Failed to list available quiz files:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while listing quiz files.";
        setError(errorMessage);
        setAllLoadedQuestions([]);
        setIsLoading(false); 
      }
    };
    initializeQuizData();
  }, []); 

  useEffect(() => {
    if (!selectedFile) {
      if (availableFiles.length === 0) {
          setIsLoading(false);
      }
      return;
    }

    const fetchQuestions = async () => {
      setIsLoading(true); 
      setError(null);     
      
      try {
        const data = await loadQuizData(selectedFile);
        if (data && data.length > 0) {
          setAllLoadedQuestions(data);
        } else {
          setAllLoadedQuestions([]); 
          setError(`No valid questions found in '${selectedFile}'. Please ensure it's correctly formatted and contains data.`);
        }
      } catch (err) {
        console.error(`Failed to load quiz data from ${selectedFile}:`, err);
        setAllLoadedQuestions([]); 
        if (err instanceof Error) {
          setError(err.message); 
        } else {
          setError(`An unexpected error occurred while loading data from '${selectedFile}'.`);
        }
      } finally {
        setIsLoading(false); 
      }
    };
    fetchQuestions();
  }, [selectedFile, availableFiles.length]); 

  const handleStartQuiz = useCallback((numQuestions: number, mode: QuizMode) => {
    if (allLoadedQuestions.length === 0) {
      setError("Cannot start quiz: No questions loaded from the selected file.");
      return;
    }
    setQuizMode(mode);
    const getRandomQuestions = (questions: Question[], count: number): Question[] => {
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, questions.length));
    };
    const randomQuestions = getRandomQuestions(allLoadedQuestions, numQuestions);
    setCurrentQuizQuestions(randomQuestions);
    setUserAnswers(Array(randomQuestions.length).fill(null));
    setQuizState("active");
  }, [allLoadedQuestions]);

  const handleQuizComplete = useCallback((answers: (number | null)[]) => {
    setUserAnswers(answers);
    setQuizState("results");
  }, []);

  const handleRetakeQuiz = useCallback(() => {
    setQuizState("setup");
    setCurrentQuizQuestions([]);
    setUserAnswers([]);
    // quizMode remains as previously selected
  }, []);

  const handleFileChange = (value: string) => {
    setSelectedFile(value);
    setQuizState("setup"); 
    setCurrentQuizQuestions([]);
    setUserAnswers([]);
    setAllLoadedQuestions([]); 
  };

  const showGlobalLoader = isLoading && (availableFiles.length === 0 || !selectedFile || (!!selectedFile && allLoadedQuestions.length === 0 && !error));

  if (showGlobalLoader) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-2 bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-semibold">Loading Quiz Whiz...</p>
        {(!selectedFile && availableFiles.length === 0) && <p className="text-sm text-muted-foreground mt-2">Searching for quiz files...</p>}
        {(selectedFile && allLoadedQuestions.length === 0 && !error) && <p className="text-sm text-muted-foreground mt-2">Fetching questions from {selectedFile}...</p>}
      </main>
    );
  }

  if (error && availableFiles.length === 0) { 
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-2 bg-background text-foreground text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Oops! Something went wrong.</h1>
        <p className="text-lg mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Reloading
        </Button>
      </main>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center p-2 bg-background text-foreground">
      <header className="mb-4 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center justify-center">
          <BookOpenText className="h-8 w-8 md:h-10 md:w-10 mr-2 text-primary" />
          Quiz Whiz
        </h1>
        <p className="text-md md:text-lg text-muted-foreground mt-1">Sharpen Your Mind, One Question at a Time!</p>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8">
        {availableFiles.length > 0 ? (
          <Card className="mb-4 shadow-md w-full mx-auto">
            <CardHeader className="p-3 md:p-4">
              <CardTitle className="text-md md:text-lg flex items-center justify-center">
                <FileText className="mr-2 h-4 w-4 md:h-5 md:w-5 text-primary" />
                Select Quiz File
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <Label htmlFor="quizFileSelect" className="sr-only">Select Quiz File</Label>
              <Select onValueChange={handleFileChange} value={selectedFile || ""}>
                <SelectTrigger id="quizFileSelect" className="w-full text-sm md:text-base">
                  <SelectValue placeholder="Select a quiz file" />
                </SelectTrigger>
                <SelectContent>
                  {availableFiles.map((file) => (
                    <SelectItem key={file} value={file} className="text-sm md:text-base">
                      {file}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error && selectedFile && <p className="text-destructive text-xs md:text-sm mt-2 text-center">{error}</p>}
            </CardContent>
          </Card>
        ) : (
           !isLoading && !error && 
            <Card className="mb-4 shadow-md w-full mx-auto">
              <CardHeader className="p-3 md:p-4">
                <CardTitle className="text-md md:text-lg flex items-center justify-center text-muted-foreground">
                  <AlertTriangle className="mr-2 h-4 w-4 md:h-5 md:w-5 text-destructive" />
                  No Quiz Files Found
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <p className="text-center text-muted-foreground text-sm md:text-base">
                  Please add Excel (.xlsx or .xls) files to the 'public' folder and refresh the page.
                </p>
              </CardContent>
            </Card>
        )}

        {quizState === "setup" && (
          <QuizSetup 
            onStartQuiz={handleStartQuiz} 
            maxQuestions={allLoadedQuestions.length} 
            isLoading={isLoading && !!selectedFile && allLoadedQuestions.length === 0 && !error}
            hasLoadedQuestions={allLoadedQuestions.length > 0}
            hasFilesAvailable={availableFiles.length > 0}
            initialMode={quizMode}
          />
        )}
        {quizState === "active" && currentQuizQuestions.length > 0 && (
          <QuizArea 
            questions={currentQuizQuestions} 
            onQuizComplete={handleQuizComplete} 
            quizMode={quizMode}
          />
        )}
        {quizState === "results" && currentQuizQuestions.length > 0 && (
          <QuizResults
            questions={currentQuizQuestions}
            userAnswers={userAnswers}
            onRetakeQuiz={handleRetakeQuiz}
            quizMode={quizMode}
          />
        )}
      </div>
      <footer className="mt-6 text-center text-xs text-muted-foreground">
        {currentYear !== null ? <p>&copy; {currentYear} Quiz Whiz. All rights reserved.</p> : <p>Loading year...</p>}
        <p>Built with Next.js & ShadCN UI. Data from Excel.</p>
      </footer>
    </main>
  );
}
    