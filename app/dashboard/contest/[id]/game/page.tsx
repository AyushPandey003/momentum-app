"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Trophy, Zap, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardNav } from "@/components/dashboard-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";

interface Player {
  userId: string;
  username: string;
  score: number;
}

interface Question {
  questionId: string;
  questionText: string;
  options: string[];
  index: number;
}

interface GameState {
  status: "connecting" | "waiting" | "in_progress" | "finished";
  players: Player[];
  currentQuestion: Question | null;
  totalQuestions: number;
  myScore: number;
  lastAnswerResult: {
    correct: boolean;
    userId?: string;
    username?: string;
    points?: number;
  } | null;
}

export default function ContestGamePage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const { toast } = useToast();
  const { data: session, isPending } = authClient.useSession();

  const [gameState, setGameState] = useState<GameState>({
    status: "connecting",
    players: [],
    currentQuestion: null,
    totalQuestions: 0,
    myScore: 0,
    lastAnswerResult: null,
  });

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [questionTimer, setQuestionTimer] = useState<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [contestCreatorId, setContestCreatorId] = useState<string | null>(null);

  // WebSocket URL from environment or default (Go service on port 8080)
  const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

  // Handle redirect to leaderboard when game finishes
  useEffect(() => {
    if (gameState.status === "finished") {
      const timer = setTimeout(() => {
        router.push(`/dashboard/contest/${contestId}/leaderboard`);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState.status, contestId, router]);

  const connectWebSocket = useCallback(async () => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to join the contest",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    try {
      // Get JWT token for WebSocket authentication
      const response = await fetch("/api/contest/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId }),
      });

      if (!response.ok) {
        throw new Error("Failed to get authentication token");
      }

      const { token } = await response.json();

      // Connect to WebSocket - Go service uses /ws/contests/{id} format
      const ws = new WebSocket(`${WS_URL}/ws/contests/${contestId}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setGameState((prev) => ({ ...prev, status: "waiting" }));
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to game server",
          variant: "destructive",
        });
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        
        if (event.code === 1000 || gameState.status === "finished") {
          return;
        }

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => {
            toast({
              title: "Reconnecting...",
              description: `Attempt ${reconnectAttempts.current} of ${maxReconnectAttempts}`,
            });
            connectWebSocket();
          }, 2000 * reconnectAttempts.current);
        } else {
          toast({
            title: "Connection Lost",
            description: "Could not reconnect to game server",
            variant: "destructive",
          });
          router.push(`/dashboard/contest/${contestId}/lobby`);
        }
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to game server",
        variant: "destructive",
      });
    }
  }, [contestId, session?.user, router, toast, WS_URL]);

  // Fetch contest participant details to determine if user is organizer/host
  useEffect(() => {
    const fetchParticipantStatus = async () => {
      try {
        const response = await fetch(`/api/contest/${contestId}/participant-status`);
        if (response.ok) {
          const data = await response.json();
          // User is host if they are the organizer of the contest
          setIsHost(data.isOrganizer === true);
          setContestCreatorId(data.creatorId);
        }
      } catch (error) {
        console.error("Error fetching participant status:", error);
      }
    };

    if (session?.user?.id) {
      fetchParticipantStatus();
    }
  }, [contestId, session?.user?.id]);

  useEffect(() => {
    if (!isPending && session?.user) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [connectWebSocket, isPending, session?.user]);

  const handleWebSocketMessage = (message: any) => {
    const { type, payload } = message;

    switch (type) {
      case "PLAYER_JOINED":
        // Update player list when someone joins
        if (payload.players) {
          setGameState((prev) => ({
            ...prev,
            players: payload.players,
          }));
          
          toast({
            title: "Player Joined",
            description: `${payload.username || 'A player'} joined the game`,
          });
        }
        break;

      case "PLAYER_LEFT":
        toast({
          title: "Player Left",
          description: "A player left the game",
        });
        break;

      case "PLAYER_LIST":
        setGameState((prev) => ({
          ...prev,
          players: payload.players,
        }));
        
        // Host is determined by contest creator, not first player
        // This is set in the useEffect that fetches contest details
        break;

      case "CONTEST_STARTED":
        toast({
          title: "Contest Started! 🎉",
          description: payload.message || "Contest is now in progress for everyone!",
        });
        setGameState((prev) => ({
          ...prev,
          status: "in_progress",
          totalQuestions: payload.total_questions,
          players: payload.players || prev.players,
        }));
        break;

      case "NEW_QUESTION":
        setGameState((prev) => ({
          ...prev,
          currentQuestion: {
            questionId: payload.question_id,
            questionText: payload.question_text,
            options: payload.options,
            index: (payload.question_number || 1) - 1, // Convert to 0-based index
          },
          totalQuestions: payload.total_questions || prev.totalQuestions,
          lastAnswerResult: null,
        }));
        setSelectedAnswer(null);
        setHasAnswered(false);
        // Setup per-question countdown timer (client-side) using payload.timer
        // Clear any existing interval first
        if (timerIntervalRef.current) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        const initialTimer = payload.timer || 0;
        setQuestionTimer(initialTimer);
        if (initialTimer > 0) {
          // Start a 1s interval to decrement remaining time
          timerIntervalRef.current = window.setInterval(() => {
            setQuestionTimer((t) => {
              if (t === null) return null;
              if (t <= 1) {
                if (timerIntervalRef.current) {
                  window.clearInterval(timerIntervalRef.current);
                  timerIntervalRef.current = null;
                }
                return 0;
              }
              return t - 1;
            });
          }, 1000);
        }

        toast({
          title: `Question ${payload.question_number}/${payload.total_questions}`,
          description: "Answer quickly to earn more points!",
        });
        break;

      case "QUESTION_TIMEOUT":
        // Server revealed the correct answer for the timed-out question
        setQuestionTimer(0);
        if (timerIntervalRef.current) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setGameState((prev) => ({
          ...prev,
          lastAnswerResult: {
            correct: false,
            // attach revealed answer to lastAnswerResult for UI if desired
          },
        }));

        toast({
          title: "Time's up",
          description: `Correct answer: ${payload.correct_answer}`,
        });
        break;

      case "ANSWER_RESULT":
        // This is sent to the player who submitted the answer
        if (payload.is_correct) {
          setGameState((prev) => ({
            ...prev,
            myScore: payload.new_score,
            lastAnswerResult: {
              correct: true,
              points: payload.points_awarded,
            },
          }));

          toast({
            title: "Correct! 🎉",
            description: `You earned ${payload.points_awarded} points in ${payload.time_taken?.toFixed(1)}s`,
          });
        } else {
          toast({
            title: "Incorrect ❌",
            description: "That's not the right answer. Wait for the next question.",
            variant: "destructive",
          });
        }
        break;

      case "SCORE_UPDATE":
        // Broadcast to all players when someone scores
        setGameState((prev) => {
          const updatedPlayers = prev.players.map((p) =>
            p.userId === payload.user_id ? { ...p, score: payload.score } : p
          );
          
          return {
            ...prev,
            players: updatedPlayers,
            lastAnswerResult: {
              correct: true,
              userId: payload.user_id,
              username: payload.username,
              points: payload.points_earned,
            },
          };
        });

        if (payload.user_id !== session?.user?.id) {
          toast({
            title: "Score Update",
            description: `${payload.username} earned ${payload.points_earned} points!`,
          });
        }
        break;

      case "GAME_OVER":
        setGameState((prev) => ({
          ...prev,
          status: "finished",
          players: payload.final_scoreboard || payload.scoreboard,
        }));
        
        toast({
          title: "Game Over! 🏁",
          description: payload.message || "See the final results",
        });

        // Redirect to leaderboard after 5 seconds
        setTimeout(() => {
          router.push(`/dashboard/contest/${contestId}/leaderboard`);
        }, 5000);
        break;

      default:
        console.log("Unknown message type:", type);
    }
  };

  const startGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Go WebSocket expects { type: "START_GAME" }
      wsRef.current.send(
        JSON.stringify({
          type: "START_GAME"
        })
      );
      
      toast({
        title: "Starting Game...",
        description: "Get ready!",
      });
    }
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || hasAnswered || !gameState.currentQuestion) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Go WebSocket expects { type: "SUBMIT_ANSWER", question_id: "...", answer: "..." }
      const answer = gameState.currentQuestion.options[selectedAnswer];
      
      wsRef.current.send(
        JSON.stringify({
          type: "SUBMIT_ANSWER",
          question_id: gameState.currentQuestion.questionId,
          answer: answer,
        })
      );
      setHasAnswered(true);
      
      toast({
        title: "Answer Submitted",
        description: "Waiting for results...",
      });
    }
  };

  // Show loading while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse">
                <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-lg">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render different states
  if (gameState.status === "connecting") {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse">
                <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-lg">Connecting to game server...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState.status === "waiting") {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="w-6 h-6" />
                Waiting for Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-3">
                  {gameState.players.map((player) => (
                    <div
                      key={player.userId}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Avatar>
                        <AvatarFallback>{player.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{player.username}</p>
                        {player.userId === session?.user?.id && (
                          <p className="text-sm text-muted-foreground">(You)</p>
                        )}
                      </div>
                      {player.userId === gameState.players[0]?.userId && (
                        <Badge>Host</Badge>
                      )}
                    </div>
                  ))}
                </div>

                {isHost && (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You are the host. Start the game when ready!
                    </p>
                    <Button onClick={startGame} size="lg" className="w-full">
                      Start Game
                    </Button>
                  </div>
                )}

                {!isHost && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Waiting for the host to start the game...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState.status === "finished") {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const myRank = sortedPlayers.findIndex((p) => p.userId === session?.user?.id) + 1;

    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center flex items-center justify-center gap-2">
                <Trophy className="w-8 h-8 text-yellow-500" />
                Game Over!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">{gameState.myScore}</p>
                  <p className="text-muted-foreground">Your Final Score</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rank: #{myRank} of {sortedPlayers.length}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Final Standings</h3>
                  {sortedPlayers.map((player, index) => (
                    <div
                      key={player.userId}
                      className={`flex items-center gap-3 p-3 border rounded-lg ${
                        player.userId === session?.user?.id ? "bg-primary/5 border-primary" : ""
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <span className="font-bold">#{index + 1}</span>
                      </div>
                      <Avatar>
                        <AvatarFallback>{player.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{player.username}</p>
                        {player.userId === session?.user?.id && (
                          <p className="text-xs text-muted-foreground">(You)</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{player.score}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Redirecting to leaderboard in 5 seconds...
                  </p>
                  <Button
                    onClick={() => router.push(`/dashboard/contest/${contestId}/leaderboard`)}
                    variant="outline"
                  >
                    View Leaderboard Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // In-progress game state
  const { currentQuestion } = gameState;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg">Waiting for next question...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion.index + 1) / gameState.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      Question {currentQuestion.index + 1} of {gameState.totalQuestions}
                    </span>
                    <span className="font-bold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>

            {/* Question */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-2xl">{currentQuestion.questionText}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {questionTimer !== null ? (
                    <span className="font-mono">{questionTimer}s</span>
                  ) : (
                    <span>--</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedAnswer?.toString()}
                  onValueChange={(value) => setSelectedAnswer(parseInt(value))}
                  disabled={hasAnswered}
                >
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={`option-${currentQuestion.questionId}-${index}`}
                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAnswer === index
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        } ${hasAnswered ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <Button
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null || hasAnswered}
                  className="w-full mt-6"
                  size="lg"
                >
                  {hasAnswered ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Answer Submitted
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Submit Answer
                    </>
                  )}
                </Button>

                {gameState.lastAnswerResult && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      gameState.lastAnswerResult.correct
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {gameState.lastAnswerResult.correct ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <p className="font-medium">
                        {gameState.lastAnswerResult.correct
                          ? `${gameState.lastAnswerResult.username} answered correctly! +${gameState.lastAnswerResult.points} points`
                          : "Moving to next question..."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Scoreboard */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Live Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...gameState.players]
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div
                        key={player.userId}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          player.userId === session?.user?.id
                            ? "bg-primary/10 border border-primary"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background text-xs font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {player.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{player.username}</p>
                          {player.userId === session?.user?.id && (
                            <p className="text-xs text-muted-foreground">(You)</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{player.score}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
