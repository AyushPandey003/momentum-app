"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Trophy, Star, Zap, ChevronRight, SkipForward, Code2, ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { checkLeetCodeSubmission, connectLeetCodeUsername, getLeetCodeUsername, disconnectLeetCode } from "@/server/leetcode"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface QuizQuestion {
  q_id: string;
  question: string;
  options: string[];
  category: string;
}

interface LeetCodeQuestion {
  title: string;
  titleSlug: string;
  difficulty: string;
  acRate: string;
  paidOnly: string;
  status: string;
  topicTags: string;
  url: string;
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

  // LeetCode specific states
  const [isLeetCodeMode, setIsLeetCodeMode] = useState(false);
  const [leetcodeQuestion, setLeetcodeQuestion] = useState<LeetCodeQuestion | null>(null);
  const [leetcodeUsername, setLeetcodeUsername] = useState<string>("");
  const [connectedLeetcodeUsername, setConnectedLeetcodeUsername] = useState<string | null>(null);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Easy");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  
  const { toast } = useToast();

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

  // Check if user has connected LeetCode
  useEffect(() => {
    const checkLeetCodeConnection = async () => {
      const { username } = await getLeetCodeUsername();
      setConnectedLeetcodeUsername(username);
    };
    checkLeetCodeConnection();
  }, []);

  // Fetch LeetCode topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch("/api/leetcode/questions", {
          method: "POST"
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableTopics(data.topics || []);
        }
      } catch (error) {
        console.error("Failed to fetch topics:", error);
      }
    };
    if (isLeetCodeMode) {
      fetchTopics();
    }
  }, [isLeetCodeMode]);

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

  // LeetCode specific functions
  const fetchLeetCodeQuestion = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams();
      if (selectedDifficulty) params.append("difficulty", selectedDifficulty);
      if (selectedTopic && selectedTopic !== "all") params.append("topic", selectedTopic);

      const response = await fetch(`/api/leetcode/questions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch LeetCode question.");
      }
      const data = await response.json();
      setLeetcodeQuestion(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load LeetCode question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectLeetCode = async () => {
    if (!leetcodeUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter your LeetCode username",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const result = await connectLeetCodeUsername(leetcodeUsername.trim());
    setIsLoading(false);

    if (result.success) {
      setConnectedLeetcodeUsername(leetcodeUsername.trim());
      setIsConnectDialogOpen(false);
      toast({
        title: "Success!",
        description: "LeetCode account connected successfully"
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to connect LeetCode account",
        variant: "destructive"
      });
    }
  };

  const handleDisconnectLeetCode = async () => {
    const result = await disconnectLeetCode();
    if (result.success) {
      setConnectedLeetcodeUsername(null);
      toast({
        title: "Disconnected",
        description: "LeetCode account disconnected"
      });
    }
  };

  const handleCheckLeetCodeSolution = async () => {
    if (!connectedLeetcodeUsername || !leetcodeQuestion) return;

    setIsCheckingSubmission(true);
    
    try {
      const result = await checkLeetCodeSubmission(
        connectedLeetcodeUsername,
        leetcodeQuestion.titleSlug
      );

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to check submission",
          variant: "destructive"
        });
        return;
      }

      if (result.hasAccepted) {
        // Success!
        const pointsEarned = 
          leetcodeQuestion.difficulty === "Easy" ? 10 : 
          leetcodeQuestion.difficulty === "Medium" ? 20 : 30;

        setTotalPoints(prev => prev + pointsEarned);
        setQuestionsAnswered(prev => prev + 1);
        setCorrectAnswers(prev => prev + 1);
        setShowPointsAnimation(true);
        setTimeout(() => setShowPointsAnimation(false), 2000);

        setResult({
          correct: true,
          points_earned: pointsEarned
        });

        toast({
          title: "🎉 Congratulations!",
          description: `You solved it! Earned ${pointsEarned} points!`
        });
      } else {
        toast({
          title: "Not Yet Solved",
          description: "We couldn't find an accepted submission. Keep trying!",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to verify solution",
        variant: "destructive"
      });
    } finally {
      setIsCheckingSubmission(false);
    }
  };

  const switchToLeetCode = () => {
    setIsLeetCodeMode(true);
    setResult(null);
    setQuestion(null);
    if (connectedLeetcodeUsername) {
      fetchLeetCodeQuestion();
    }
  };

  const switchToQuiz = () => {
    setIsLeetCodeMode(false);
    setResult(null);
    setLeetcodeQuestion(null);
    if (selectedCategory) {
      fetchQuestion(selectedCategory);
    }
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
        <CardContent className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              onClick={switchToQuiz}
              variant={!isLeetCodeMode ? "default" : "outline"}
              className="flex-1"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Quiz Challenges
            </Button>
            <Button
              onClick={switchToLeetCode}
              variant={isLeetCodeMode ? "default" : "outline"}
              className="flex-1"
            >
              <Code2 className="w-4 h-4 mr-2" />
              LeetCode Challenges
            </Button>
          </div>

          {/* LeetCode Connection */}
          {isLeetCodeMode && (
            <div className="space-y-3">
              {connectedLeetcodeUsername ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Connected: {connectedLeetcodeUsername}</span>
                  </div>
                  <Button
                    onClick={handleDisconnectLeetCode}
                    variant="ghost"
                    size="sm"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Code2 className="w-4 h-4 mr-2" />
                      Connect LeetCode Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect Your LeetCode Account</DialogTitle>
                      <DialogDescription>
                        Enter your LeetCode username to verify your solutions automatically.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Enter LeetCode username"
                        value={leetcodeUsername}
                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleConnectLeetCode();
                          }
                        }}
                      />
                      <Button
                        onClick={handleConnectLeetCode}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect Account"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {/* Category/Difficulty Selection */}
          {!isLeetCodeMode ? (
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
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Difficulty</Label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Topic (Optional)</Label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="All topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All topics</SelectItem>
                    {availableTopics.slice(0, 20).map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {connectedLeetcodeUsername && (
                <Button
                  onClick={fetchLeetCodeQuestion}
                  className="w-full"
                  disabled={isLoading}
                >
                  Get New Challenge
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isLeetCodeMode ? leetcodeQuestion?.titleSlug : question?.q_id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 w-full">
            <CardHeader>
              <CardTitle>Challenge Yourself!</CardTitle>
              <Badge variant="outline" className="w-fit">
                {isLeetCodeMode ? `LeetCode - ${selectedDifficulty}` : selectedCategory}
              </Badge>
            </CardHeader>
            <CardContent>
              {/* Loading State */}
              {isLoading && !question && !leetcodeQuestion && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Loading question...</span>
                </div>
              )}

              {/* LeetCode Mode */}
              {isLeetCodeMode && !connectedLeetcodeUsername && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Code2 className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Your LeetCode Account</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your LeetCode account to start solving coding challenges
                  </p>
                  <Button onClick={() => setIsConnectDialogOpen(true)}>
                    <Code2 className="w-4 h-4 mr-2" />
                    Connect LeetCode
                  </Button>
                </div>
              )}

              {isLeetCodeMode && connectedLeetcodeUsername && leetcodeQuestion && !result && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{leetcodeQuestion.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge
                        variant={
                          leetcodeQuestion.difficulty === "Easy" ? "default" :
                          leetcodeQuestion.difficulty === "Medium" ? "secondary" : "destructive"
                        }
                      >
                        {leetcodeQuestion.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        Acceptance: {parseFloat(leetcodeQuestion.acRate).toFixed(1)}%
                      </Badge>
                      {leetcodeQuestion.topicTags.split(';').slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag.trim()}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Solve this problem on LeetCode and come back to verify your solution!
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                      onClick={() => window.open(leetcodeQuestion.url, '_blank')}
                      variant="default"
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Solve on LeetCode
                    </Button>
                    <Button
                      onClick={handleCheckLeetCodeSolution}
                      disabled={isCheckingSubmission}
                      variant="secondary"
                      className="flex-1"
                    >
                      {isCheckingSubmission ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          I Solved It!
                        </>
                      )}
                    </Button>
                  </div>

                  <Button
                    onClick={fetchLeetCodeQuestion}
                    variant="outline"
                    disabled={isLoading}
                    className="w-full"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip Challenge
                  </Button>
                </div>
              )}

              {/* Quiz Mode */}
              {!isLeetCodeMode && question && !result && (
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
                <Button 
                  onClick={isLeetCodeMode ? fetchLeetCodeQuestion : handleNextQuestion} 
                  disabled={isLoading} 
                  className="w-full"
                >
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
