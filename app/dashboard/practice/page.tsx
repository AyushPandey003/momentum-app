"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Brain,
  Play,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Trophy,
  RotateCcw,
  ArrowLeft,
  Zap,
  Loader2,
  BookOpen,
  BarChart3,
  Flame,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";

interface PracticeQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  tags: string[];
  points: number;
  timeAllocationSeconds: number;
}

interface QuizResult {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  points: number;
}

type QuizPhase = "setup" | "quiz" | "results";

export default function PracticePage() {
  const { data: session, isPending } = authClient.useSession();
  const { toast } = useToast();

  // Setup state
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [counts, setCounts] = useState<{ difficulty: string; category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Quiz state
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Results state
  const [results, setResults] = useState<QuizResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // Load categories on mount
  useEffect(() => {
    if (!isPending && session?.user) {
      loadCategories();
    }
  }, [isPending, session?.user]);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/practice/questions?limit=0");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setCounts(data.counts || []);
      }
    } catch {
      // Silent fail for initial load
    } finally {
      setInitialLoading(false);
    }
  };

  const getAvailableCount = useCallback(() => {
    if (counts.length === 0) return 0;
    return counts
      .filter((c) => {
        if (difficulty !== "all" && c.difficulty !== difficulty) return false;
        if (category !== "all" && c.category !== category) return false;
        return true;
      })
      .reduce((sum, c) => sum + c.count, 0);
  }, [counts, difficulty, category]);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty !== "all") params.set("difficulty", difficulty);
      if (category !== "all") params.set("category", category);
      params.set("limit", questionCount.toString());

      const response = await fetch(`/api/practice/questions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load questions");

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        toast({
          title: "No Questions Available",
          description: "No questions match your selected filters. Try different settings.",
          variant: "destructive",
        });
        return;
      }

      setQuestions(data.questions);
      setResults([]);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setShowExplanation(false);
      setStreak(0);
      setMaxStreak(0);
      setPhase("quiz");
      startTimer(data.questions[0].timeAllocationSeconds);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    setQuestionStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    if (hasAnswered) return;
    const question = questions[currentIndex];
    if (!question) return;

    setHasAnswered(true);
    setShowExplanation(true);
    setStreak(0);

    setResults((prev) => [
      ...prev,
      {
        questionId: question.id,
        selectedAnswer: "",
        correctAnswer: question.correctAnswer,
        isCorrect: false,
        timeSpent: question.timeAllocationSeconds,
        points: 0,
      },
    ]);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || hasAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const question = questions[currentIndex];
    const answer = question.options[selectedAnswer];
    const isCorrect = answer === question.correctAnswer;
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const pointsEarned = isCorrect
      ? Math.round(question.points * Math.max(0.1, 1 - timeSpent / question.timeAllocationSeconds))
      : 0;

    setHasAnswered(true);
    setShowExplanation(true);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((prev) => Math.max(prev, newStreak));
    } else {
      setStreak(0);
    }

    setResults((prev) => [
      ...prev,
      {
        questionId: question.id,
        selectedAnswer: answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        timeSpent,
        points: pointsEarned,
      },
    ]);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("results");
      return;
    }

    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setShowExplanation(false);
    startTimer(questions[nextIdx].timeAllocationSeconds);
  };

  const resetQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("setup");
    setQuestions([]);
    setResults([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setShowExplanation(false);
    setStreak(0);
    setMaxStreak(0);
  };

  const retryQuiz = () => {
    setResults([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setShowExplanation(false);
    setStreak(0);
    setMaxStreak(0);
    setPhase("quiz");
    startTimer(questions[0].timeAllocationSeconds);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (isPending || initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <p className="text-muted-foreground">Loading practice questions...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Card className="surface-glass border-teal-500/20">
        <CardHeader>
          <CardTitle className="text-teal-600 dark:text-teal-400">Practice</CardTitle>
          <CardDescription>Sign in to access practice questions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // ─── SETUP PHASE ───
  if (phase === "setup") {
    const available = getAvailableCount();

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            Practice Quiz
          </h1>
          <p className="text-muted-foreground mt-2">
            Sharpen your skills with self-paced quizzes. Pick your settings and start practicing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Configure Your Quiz
            </CardTitle>
            <CardDescription>
              Choose difficulty, category, and how many questions you want.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Number of Questions: <strong>{questionCount}</strong>
              </Label>
              <Slider
                value={[questionCount]}
                onValueChange={(v) => setQuestionCount(v[0])}
                min={5}
                max={30}
                step={5}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                {available > 0
                  ? `${available} question${available !== 1 ? "s" : ""} available for selected filters`
                  : "Loading availability..."}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Timed per question
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Instant feedback
                </span>
              </div>
              <Button onClick={startQuiz} size="lg" disabled={loading || available === 0}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Quiz
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick-start presets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-green-200 dark:border-green-900"
            onClick={() => {
              setDifficulty("easy");
              setQuestionCount(10);
            }}
          >
            <CardContent className="p-4 text-center">
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mb-2">
                Easy
              </Badge>
              <p className="font-medium">Quick Warmup</p>
              <p className="text-xs text-muted-foreground">10 easy questions</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-yellow-200 dark:border-yellow-900"
            onClick={() => {
              setDifficulty("medium");
              setQuestionCount(15);
            }}
          >
            <CardContent className="p-4 text-center">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 mb-2">
                Medium
              </Badge>
              <p className="font-medium">Standard Practice</p>
              <p className="text-xs text-muted-foreground">15 medium questions</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-red-200 dark:border-red-900"
            onClick={() => {
              setDifficulty("hard");
              setQuestionCount(10);
            }}
          >
            <CardContent className="p-4 text-center">
              <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 mb-2">
                Hard
              </Badge>
              <p className="font-medium">Challenge Mode</p>
              <p className="text-xs text-muted-foreground">10 hard questions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── QUIZ PHASE ───
  if (phase === "quiz") {
    const question = questions[currentIndex];
    if (!question) return null;

    const progress = ((currentIndex + 1) / questions.length) * 100;
    const timerPercent = (timeLeft / question.timeAllocationSeconds) * 100;
    const timerUrgent = timeLeft <= 5;
    const correctAnswerIndex = question.options.indexOf(question.correctAnswer);

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={resetQuiz}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Exit
          </Button>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                <Flame className="w-3 h-3 mr-1" />
                {streak} streak
              </Badge>
            )}
            <Badge variant="secondary">
              {results.filter((r) => r.isCorrect).length}/{results.length} correct
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {question.difficulty}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {question.category}
                </Badge>
                <span className="font-medium">{question.points} pts</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Timer */}
        <div className="relative">
          <Progress
            value={timerPercent}
            className={cn("h-1.5 transition-all", timerUrgent && "animate-pulse")}
          />
          <div
            className={cn(
              "absolute right-0 -top-0.5 flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full",
              timerUrgent
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Clock className="w-3 h-3" />
            {timeLeft}s
          </div>
        </div>

        {/* Question card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl leading-relaxed">{question.questionText}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup
              value={selectedAnswer?.toString()}
              onValueChange={(v) => !hasAnswered && setSelectedAnswer(parseInt(v))}
              disabled={hasAnswered}
            >
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === correctAnswerIndex;
                const showResult = hasAnswered;

                let optionStyle = "border-border hover:border-primary/50 hover:bg-muted/50";
                if (showResult && isCorrect) {
                  optionStyle = "border-green-500 bg-green-50 dark:bg-green-950/20";
                } else if (showResult && isSelected && !isCorrect) {
                  optionStyle = "border-red-500 bg-red-50 dark:bg-red-950/20";
                } else if (isSelected && !showResult) {
                  optionStyle = "border-primary bg-primary/5";
                }

                return (
                  <div
                    key={`${question.id}-opt-${index}`}
                    className={cn(
                      "flex items-center gap-3 p-4 border rounded-lg transition-all cursor-pointer",
                      optionStyle,
                      hasAnswered && "cursor-default"
                    )}
                    onClick={() => !hasAnswered && setSelectedAnswer(index)}
                  >
                    <RadioGroupItem value={index.toString()} id={`q-opt-${index}`} />
                    <Label htmlFor={`q-opt-${index}`} className="flex-1 cursor-pointer text-base">
                      {option}
                    </Label>
                    {showResult && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>

            {/* Explanation */}
            {showExplanation && question.explanation && (
              <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Explanation</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">{question.explanation}</p>
              </div>
            )}

            {/* Action button */}
            <div className="pt-2">
              {!hasAnswered ? (
                <Button
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null || timeLeft === 0}
                  className="w-full"
                  size="lg"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {timeLeft === 0 ? "Time's Up" : "Submit Answer"}
                </Button>
              ) : (
                <Button onClick={nextQuestion} className="w-full" size="lg">
                  {currentIndex + 1 >= questions.length ? (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      See Results
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-5 h-5 mr-2" />
                      Next Question
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── RESULTS PHASE ───
  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const maxPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const correctCount = results.filter((r) => r.isCorrect).length;
  const avgTime = results.length > 0
    ? (results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length).toFixed(1)
    : "0";
  const scorePercent = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

  const getGrade = () => {
    if (scorePercent >= 90) return { label: "Excellent", color: "text-green-600", icon: Star };
    if (scorePercent >= 70) return { label: "Great", color: "text-blue-600", icon: Trophy };
    if (scorePercent >= 50) return { label: "Good", color: "text-yellow-600", icon: Target };
    return { label: "Keep Practicing", color: "text-muted-foreground", icon: Brain };
  };

  const grade = getGrade();
  const GradeIcon = grade.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <GradeIcon className={cn("w-12 h-12 mx-auto", grade.color)} />
        <h1 className="text-3xl font-bold">{grade.label}!</h1>
        <p className="text-muted-foreground">
          You scored {totalPoints} out of {maxPoints} points
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{scorePercent}%</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {correctCount}/{questions.length}
            </p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{avgTime}s</p>
            <p className="text-xs text-muted-foreground">Avg. Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-orange-500" />
              {maxStreak}
            </p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Question-by-question review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Question Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {results.map((result, index) => {
            const question = questions[index];
            return (
              <div
                key={result.questionId}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  result.isCorrect
                    ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/10"
                    : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/10"
                )}
              >
                <div className="shrink-0 mt-0.5">
                  {result.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{question?.questionText}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                    {!result.isCorrect && result.selectedAnswer && (
                      <span>
                        Your answer: <span className="text-red-600 dark:text-red-400">{result.selectedAnswer}</span>
                      </span>
                    )}
                    <span>
                      Correct: <span className="text-green-600 dark:text-green-400">{result.correctAnswer}</span>
                    </span>
                    <span>{result.timeSpent.toFixed(1)}s</span>
                    {result.points > 0 && <span>+{result.points} pts</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={resetQuiz}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          New Quiz
        </Button>
        <Button onClick={retryQuiz}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry Same Questions
        </Button>
      </div>
    </div>
  );
}
