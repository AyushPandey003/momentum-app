"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Trophy, Star, Zap, ChevronRight, SkipForward } from "lucide-react"

interface QuizQuestion {
  q_id: string;
  question: string;
  options: string[];
  category: string;
}

interface CheckAnswerResponse {
  correct: boolean;
  actual_answer?: string;
  answer_explanation?: string;
  points_earned: number;
}

export function ChallengeYourself() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<CheckAnswerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Fetch available categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          if (data.length > 0 && !selectedCategory) {
            setSelectedCategory(data[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories(["Cognitive"]); // Fallback
        setSelectedCategory("Cognitive");
      }
    };
    fetchCategories();
  }, []);

  const fetchQuestion = async (category?: string) => {
    const categoryToUse = category || selectedCategory;
    if (!categoryToUse) return;

    setIsLoading(true);
    setResult(null);
    setSelectedAnswer(null);
    try {
      const response = await fetch(`http://localhost:8000/quiz/random?category=${categoryToUse}`);
      if (!response.ok) {
        throw new Error("Failed to fetch question.");
      }
      const data = await response.json();
      setQuestion(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load question. Please make sure the backend server is running on http://localhost:8000");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchQuestion(selectedCategory);
    }
  }, [selectedCategory]);

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !question) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/quiz/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q_id: question.q_id,
          user_answer: selectedAnswer,
          category: question.category,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check answer.");
      }

      const data = await response.json();
      setResult(data);
      setQuestionsAnswered(prev => prev + 1);
      
      if (data.correct) {
        setCorrectAnswers(prev => prev + 1);
        setTotalPoints(prev => prev + data.points_earned);
        setShowPointsAnimation(true);
        setTimeout(() => setShowPointsAnimation(false), 2000);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to check answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (!question) return;

    try {
      await fetch("http://localhost:8000/quiz/skip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q_id: question.q_id,
          category: question.category,
        }),
      });
      
      // Load next question
      fetchQuestion();
    } catch (error) {
      console.error(error);
      // Still load next question even if skip endpoint fails
      fetchQuestion();
    }
  };

  const handleNextQuestion = () => {
    fetchQuestion();
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    // Reset stats when changing category
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
  };

  return (
    <div className="space-y-6 relative w-full">
      {/* Points Animation Overlay */}
      <AnimatePresence>
        {showPointsAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4">
              <Sparkles className="w-8 h-8 animate-spin" />
              <div className="text-center">
                <div className="text-4xl font-bold">+10 Points!</div>
                <div className="text-xl font-semibold flex items-center gap-2 justify-center mt-2">
                  <Trophy className="w-6 h-6" />
                  Awesome!
                </div>
              </div>
              <Star className="w-8 h-8 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 w-full">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="flex items-center gap-2 justify-center">
              <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base whitespace-nowrap">Total: {totalPoints}</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Zap className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base whitespace-nowrap">Questions: {questionsAnswered}</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Star className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base whitespace-nowrap">Correct: {correctAnswers}</span>
            </div>
            {questionsAnswered > 0 && (
              <div className="flex items-center gap-2 justify-center col-span-2 md:col-span-1">
                <Badge variant="secondary" className="text-sm sm:text-base">
                  Accuracy: {Math.round((correctAnswers / questionsAnswered) * 100)}%
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Selection */}
  <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Choose Your Challenge Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full min-w-[180px]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question?.q_id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 w-full">
            <CardHeader>
              <CardTitle>Challenge Yourself!</CardTitle>
              <Badge variant="outline" className="w-fit">{selectedCategory}</Badge>
            </CardHeader>
            <CardContent>
              {isLoading && !question && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Loading question...</span>
                </div>
              )}
              {question && !result && (
                <div className="space-y-6">
                  <p className="text-lg font-semibold break-words">{question.question}</p>
                  <RadioGroup onValueChange={setSelectedAnswer} value={selectedAnswer || ""} className="space-y-2">
                    {question.options.map((option, idx) => (
                      <motion.div
                        key={option}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent transition-colors w-full"
                      >
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="flex-1 cursor-pointer break-words">{option}</Label>
                      </motion.div>
                    ))}
                  </RadioGroup>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button 
                      onClick={handleAnswerSubmit} 
                      disabled={!selectedAnswer || isLoading}
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? "Checking..." : "Submit Answer"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      onClick={handleSkipQuestion}
                      variant="outline"
                      disabled={isLoading}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className={result.correct ? "border-green-500 border-2 w-full" : "border-red-500 border-2 w-full"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.correct ? (
                    <>
                      <Trophy className="w-6 h-6 text-green-500" />
                      <span className="text-green-500">Correct! 🎉</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500">Not quite right</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.correct ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="text-center py-4"
                  >
                    <div className="text-6xl mb-4">🎊</div>
                    <p className="text-xl font-bold text-green-600">Hurrah! You earned {result.points_earned} points!</p>
                    <p className="text-muted-foreground mt-2">Keep up the great work!</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-red-600 font-semibold">Correct answer: {result.actual_answer}</p>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">{result.answer_explanation}</p>
                  </div>
                )}
                <Button onClick={handleNextQuestion} disabled={isLoading} className="w-full">
                  {isLoading ? "Loading..." : "Next Question"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
