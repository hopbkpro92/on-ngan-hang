
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Question, QuizFileMetadata, UserRole } from "@/lib/quiz-data";
import { loadQuizData, listAvailableQuizFiles, loadExamQuestions } from "@/lib/quiz-loader";
import QuizSetup from "@/components/quiz/QuizSetup";
import QuizArea from "@/components/quiz/QuizArea";
import QuizResults from "@/components/quiz/QuizResults";
import { Loader2, AlertTriangle, BookOpenText, FileText, Rocket, Users, Sun, Moon } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuizState = "setup" | "active" | "results";
type Theme = "light" | "dark";
import { getTranslations, type Language } from "@/lib/i18n";
export type QuizMode = "learning" | "testing" | "exam" | "challenge";

export default function Home() {
    const [quizState, setQuizState] = useState<QuizState>("setup");
    const [allLoadedQuestions, setAllLoadedQuestions] = useState<Question[]>([]);
    const [currentQuizQuestions, setCurrentQuizQuestions] = useState<Question[]>([]);
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentYear, setCurrentYear] = useState<number | null>(null);
    const [quizMode, setQuizMode] = useState<QuizMode>("testing");

    const [availableFiles, setAvailableFiles] = useState<QuizFileMetadata[]>([]);
    const [selectedFile, setSelectedFile] = useState<QuizFileMetadata | undefined>(undefined);
    const [userRole, setUserRole] = useState<UserRole>("Kế toán");
    const [language, setLanguage] = useState<Language>("vi");
    const [theme, setTheme] = useState<Theme>("light");
    const t = getTranslations(language);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
        const savedLanguage = window.localStorage.getItem("quiz-language");
        if (savedLanguage === "vi" || savedLanguage === "en") {
            setLanguage(savedLanguage);
        }
        const savedTheme = window.localStorage.getItem("quiz-theme");
        if (savedTheme === "light" || savedTheme === "dark") {
            setTheme(savedTheme);
        }

        const initializeQuizData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const files = await listAvailableQuizFiles(userRole);
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
    }, [userRole]);

    const handleLanguageChange = (nextLanguage: Language) => {
        setLanguage(nextLanguage);
        window.localStorage.setItem("quiz-language", nextLanguage);
    };

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        window.localStorage.setItem("quiz-theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) => currentTheme === "light" ? "dark" : "light");
    };

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
                const data = await loadQuizData(selectedFile.path);
                if (data && data.length > 0) {
                    setAllLoadedQuestions(data);
                } else {
                    setAllLoadedQuestions([]);
                    setError(`No valid questions found in '${selectedFile.path}'. Please ensure it's correctly formatted and contains data.`);
                }
            } catch (err) {
                console.error(`Failed to load quiz data from ${selectedFile.path}:`, err);
                setAllLoadedQuestions([]);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError(`An unexpected error occurred while loading data from '${selectedFile.path}'.`);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, [selectedFile, availableFiles.length]);

    const handleStartQuiz = useCallback((numQuestions: number, mode: QuizMode) => {
        if (mode === "exam") {
            // For exam mode, we'll load questions from files based on user role
            setQuizMode(mode);
            setIsLoading(true);
            setError(null);

            loadExamQuestions(userRole, numQuestions)
                .then((examQuestions) => {
                    if (examQuestions.length === 0) {
                        setError("Could not load exam questions. Please check that quiz files are available.");
                        setIsLoading(false);
                        return;
                    }
                    setCurrentQuizQuestions(examQuestions);
                    setUserAnswers(Array(examQuestions.length).fill(null));
                    setQuizState("active");
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Failed to load exam questions:", err);
                    setError(err instanceof Error ? err.message : "Failed to load exam questions");
                    setIsLoading(false);
                });
            return;
        }

        // For learning and testing modes, use the current file
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
    }, [allLoadedQuestions, userRole]);

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

    const handleReviewIncorrect = useCallback(() => {
        const incorrectQuestions = currentQuizQuestions.filter((question, index) => (
            userAnswers[index] !== question.correctAnswerIndex
        ));

        if (incorrectQuestions.length === 0) {
            return;
        }

        setCurrentQuizQuestions(incorrectQuestions);
        setUserAnswers(Array(incorrectQuestions.length).fill(null));
        setQuizMode("learning");
        setQuizState("active");
    }, [currentQuizQuestions, userAnswers]);

    // Exit handler: when leaving an active quiz (especially exam mode),
    // return to setup and switch to a non-exam mode so the file selector is available again.
    const handleExitQuiz = useCallback(() => {
        setQuizState("setup");
        setCurrentQuizQuestions([]);
        setUserAnswers([]);
        setQuizMode("testing");
    }, []);

    const handleFileChange = (value: string) => {
        const file = availableFiles.find(f => f.path === value);
        if (file) {
            setSelectedFile(file);
            setQuizState("setup");
            setCurrentQuizQuestions([]);
            setUserAnswers([]);
            setAllLoadedQuestions([]);
        }
    };

    const handleRoleChange = (value: string) => {
        setUserRole(value as UserRole);
        setQuizState("setup");
        setCurrentQuizQuestions([]);
        setUserAnswers([]);
        setAllLoadedQuestions([]);
        setSelectedFile(undefined);
    };

    const showGlobalLoader = isLoading && (availableFiles.length === 0 || !selectedFile || (!!selectedFile && allLoadedQuestions.length === 0 && !error));

    if (showGlobalLoader) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 text-foreground sm:px-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-xl font-semibold">{t.loading}</p>
                {(!selectedFile && availableFiles.length === 0) && <p className="mt-2 text-sm text-muted-foreground">{t.searchingFiles}</p>}
                {(selectedFile && allLoadedQuestions.length === 0 && !error) && <p className="mt-2 text-sm text-muted-foreground">{t.loadingQuestions} {selectedFile.path}...</p>}
            </main>
        );
    }

    if (error && availableFiles.length === 0) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 text-center text-foreground sm:px-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="mb-2 text-2xl font-bold text-destructive">{t.errorTitle}</h1>
                <p className="text-lg mb-6">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                    {t.reload}
                </Button>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center px-4 py-6 text-foreground sm:px-6 sm:py-8">
            <header className="mb-6 w-full max-w-4xl text-center sm:mb-8">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        <BookOpenText className="h-4 w-4" />
                        {t.practiceHub}
                    </div>
                    <div className="inline-flex rounded-md border border-border bg-card p-1 text-xs font-semibold" aria-label={t.language}>
                        <button type="button" onClick={() => handleLanguageChange("vi")} className={`rounded px-2.5 py-1 ${language === "vi" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>VI</button>
                        <button type="button" onClick={() => handleLanguageChange("en")} className={`rounded px-2.5 py-1 ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>EN</button>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleTheme}
                        aria-label={theme === "light" ? t.darkMode : t.lightMode}
                        title={theme === "light" ? t.darkMode : t.lightMode}
                        className="gap-2 bg-card/80"
                    >
                        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <span className="hidden sm:inline">{theme === "light" ? t.darkMode : t.lightMode}</span>
                    </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t.tagline}</p>
            </header>
            <div className="w-full max-w-4xl space-y-4">
                {availableFiles.length > 0 && quizState === "setup" ? (
                    <>
                        <Card className="w-full shadow-md">
                            <CardHeader className="p-4 sm:p-5">
                                <CardTitle className="flex items-center text-base sm:text-lg">
                                    <Users className="mr-2 h-5 w-5 text-primary" />
                                    {t.selectRole}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                                <Label htmlFor="roleSelect" className="sr-only">{t.selectRole}</Label>
                                <Select onValueChange={handleRoleChange} value={userRole}>
                                    <SelectTrigger id="roleSelect" className="w-full text-sm md:text-base">
                                        <SelectValue placeholder={t.selectRolePlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Kế toán">{t.accountant}</SelectItem>
                                        <SelectItem value="Quản lý">{t.manager}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                        {quizMode !== "exam" && (
                            <Card className="w-full shadow-md">
                                <CardHeader className="p-4 sm:p-5">
                                    <CardTitle className="flex items-center text-base sm:text-lg">
                                        <FileText className="mr-2 h-5 w-5 text-primary" />
                                        {t.selectQuizFile}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                                    <Label htmlFor="quizFileSelect" className="sr-only">{t.selectQuizFile}</Label>
                                    <Select onValueChange={handleFileChange} value={selectedFile?.path || ""}>
                                        <SelectTrigger id="quizFileSelect" className="w-full text-sm md:text-base">
                                            <SelectValue placeholder={t.selectQuizFilePlaceholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableFiles.map((file) => (
                                                <SelectItem key={file.path} value={file.path}>{file.path}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {error && selectedFile && <p className="mt-2 text-center text-xs text-destructive md:text-sm">{error}</p>}
                                </CardContent>
                            </Card>
                        )}
                    </>
                ) : quizState === "setup" && quizMode === "exam" ? (
                    <>
                        <Card className="mb-4 shadow-md w-full mx-auto">
                            <CardHeader className="p-3 md:p-4">
                                <CardTitle className="flex items-center text-base sm:text-lg">
                                    <Users className="mr-2 h-4 w-4 md:h-5 md:w-5 text-primary" />
                                    {t.selectRole}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 md:p-4 pt-0">
                                <Label htmlFor="roleSelectExam" className="sr-only">{t.selectRole}</Label>
                                <Select onValueChange={handleRoleChange} value={userRole}>
                                    <SelectTrigger id="roleSelectExam" className="w-full text-sm md:text-base">
                                        <SelectValue placeholder={t.selectRolePlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Kế toán" className="text-sm md:text-base">
                                            {t.accountant}
                                        </SelectItem>
                                        {/* <SelectItem value="Tín dụng" className="text-sm md:text-base">
                                            Tín dụng
                                        </SelectItem> */}
                                        <SelectItem value="Quản lý" className="text-sm md:text-base">
                                            {t.manager}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                        <Card className="mb-4 shadow-md w-full mx-auto">
                            <CardHeader className="p-3 md:p-4">
                                <CardTitle className="flex items-center text-base text-green-700 sm:text-lg">
                                    <Rocket className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                                    {t.examMode}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 md:p-4 pt-0">
                                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                                    {t.examDescription.replace("{role}", language === "vi" ? userRole : userRole === "Kế toán" ? t.accountant : t.manager)}
                                </p>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    !isLoading && !error && availableFiles.length === 0 &&
                    <Card className="mb-4 shadow-md w-full mx-auto">
                        <CardHeader className="p-3 md:p-4">
                            <CardTitle className="text-md md:text-lg flex items-center justify-center text-muted-foreground">
                                <AlertTriangle className="mr-2 h-4 w-4 md:h-5 md:w-5 text-destructive" />
                                {t.noQuizFiles}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 md:p-4 pt-0">
                            {t.addQuizFiles}
                        </CardContent>
                    </Card>
                )}

                {quizState === "setup" && (
                    <QuizSetup
                        onStartQuiz={handleStartQuiz}
                        maxQuestions={allLoadedQuestions.length}
                        isLoading={isLoading && !!selectedFile && allLoadedQuestions.length === 0 && !error}
                        hasLoadedQuestions={allLoadedQuestions.length > 0}
                        language={language}
                        hasFilesAvailable={availableFiles.length > 0}
                        initialMode={quizMode}
                    />
                )}
                {quizState === "active" && currentQuizQuestions.length > 0 && (
                    <QuizArea
                        questions={currentQuizQuestions}
                        language={language}
                        onQuizComplete={handleQuizComplete}
                        quizMode={quizMode}
                        onExit={handleExitQuiz}
                    />
                )}
                {quizState === "results" && currentQuizQuestions.length > 0 && (
                    <QuizResults
                        questions={currentQuizQuestions}
                        userAnswers={userAnswers}
                        language={language}
                        onRetakeQuiz={handleRetakeQuiz}
                        onReviewIncorrect={handleReviewIncorrect}
                        quizMode={quizMode}
                    />
                )}
            </div>
            <footer className="mt-10 w-full max-w-4xl border-t border-border/70 pt-5 text-center text-xs leading-5 text-muted-foreground">
                <p>{t.footer}</p>
                {currentYear !== null && <p>&copy; {currentYear} Quiz Whiz.</p>}
            </footer>
        </main>
    );
}
    