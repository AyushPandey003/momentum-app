"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Clock, CheckCircle, XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { DashboardNav } from "@/components/dashboard-nav";
import { getContestLeaderboard } from "@/server/contests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth-utils";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  score: number | null;
  timeSpentSeconds: number | null;
  submittedAt: Date | null;
  totalSubmissions: number;
  correctSubmissions: number | null;
}

interface ContestInfo {
  id: string;
  name: string;
  description: string | null;
  status: string;
  showResultsAfter: Date | null;
  shouldShowResults: boolean;
}

export default function ContestLeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const [contest, setContest] = useState<ContestInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080";

  const connectWebSocket = useCallback(() => {
    if (!contestId || contest?.status !== "in_progress") return;

    const ws = new WebSocket(`${WS_URL}/ws/contests/${contestId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected for leaderboard");
      setIsLiveMode(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsLiveMode(false);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      setIsLiveMode(false);
      // Load final results from DB after WebSocket closes
      loadLeaderboard();
    };
  }, [contestId, contest?.status]);

  const handleWebSocketMessage = (message: any) => {
    const { type, payload } = message;

    switch (type) {
      case "SCORE_UPDATE":
        // Update leaderboard in real-time
        setLeaderboard((prev) => {
          const updated = prev.map((entry) =>
            entry.userId === payload.user_id
              ? { ...entry, score: payload.score || 0 }
              : entry
          );
          // Re-sort by score
          return updated.sort((a, b) => (b.score || 0) - (a.score || 0)).map((entry, index) => ({
            ...entry,
            rank: index + 1
          }));
        });
        break;

      case "PLAYER_JOINED":
        // Add new player to leaderboard or update player list
        if (payload.players) {
          const newLeaderboard = payload.players.map((p: any, index: number) => ({
            rank: index + 1,
            userId: p.user_id || p.userId,
            userName: p.username,
            userImage: null,
            score: p.score || 0,
            timeSpentSeconds: null,
            submittedAt: null,
            totalSubmissions: 0,
            correctSubmissions: null
          }));
          setLeaderboard(newLeaderboard);
        }
        break;

      case "GAME_OVER":
        // Contest finished, load final results from DB to ensure accuracy
        setIsLiveMode(false);
        if (wsRef.current) {
          wsRef.current.close();
        }
        // Wait a bit for DB to save, then reload
        setTimeout(() => loadLeaderboard(), 2000);
        break;
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [contestId]);

  useEffect(() => {
    // Connect to WebSocket if contest is in progress
    if (contest?.status === "in_progress" && !isLiveMode) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [contest?.status, connectWebSocket, isLiveMode]);

  // Check for new achievements when contest finishes
  useEffect(() => {
    if (contest?.status === "finished" && !loading) {
      checkForNewAchievements();
    }
  }, [contest?.status, loading]);

  const checkForNewAchievements = async () => {
    try {
      const response = await fetch("/api/check-achievements", {
        method: "POST",
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.newAchievements && data.newAchievements.length > 0) {
          data.newAchievements.forEach((achievement: any) => {
            toast({
              title: `🎉 Achievement Unlocked!`,
              description: `${achievement.icon} ${achievement.title} - ${achievement.description} (+${achievement.points} points)`,
              duration: 5000,
            });
          });
        }
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await getContestLeaderboard(contestId);
      setContest({
        ...data.contest,
        shouldShowResults: data.contest.shouldShowResults || false
      });
      
      // Ensure scores are not null/undefined
      const sanitizedLeaderboard = data.leaderboard.map((entry: any) => ({
        ...entry,
        score: entry.score ?? 0,
        timeSpentSeconds: entry.timeSpentSeconds ?? null,
        correctSubmissions: entry.correctSubmissions ?? 0,
        totalSubmissions: entry.totalSubmissions ?? 0
      }));
      
      setLeaderboard(sanitizedLeaderboard);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard. The contest may still be processing results.",
        variant: "destructive",
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-xl font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="text-center">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Contest not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/contests")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contests
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || isLiveMode}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {isLiveMode ? "Live" : "Refresh"}
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold">{contest.name}</h1>
            {isLiveMode && (
              <Badge variant="destructive" className="animate-pulse">
                🔴 LIVE
              </Badge>
            )}
          </div>
          {contest.description && (
            <p className="text-muted-foreground text-lg">{contest.description}</p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Badge variant={contest.status === "completed" ? "default" : contest.status === "in_progress" ? "destructive" : "secondary"}>
              {contest.status.toUpperCase()}
            </Badge>
            {leaderboard.length > 0 && (
              <Badge variant="outline">
                {leaderboard.length} Participant{leaderboard.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {isLiveMode && (
              <Badge variant="outline" className="text-green-600">
                Real-time Updates
              </Badge>
            )}
          </div>
        </div>

        {/* Results Status */}
        {!contest.shouldShowResults && (
          <Card className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
            <CardContent className="p-6 text-center">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                🔒 Results are currently hidden. Scores and rankings will be revealed after{" "}
                {contest.showResultsAfter
                  ? new Date(contest.showResultsAfter).toLocaleString()
                  : "the contest ends"}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                All participants will see the leaderboard at the same time
              </p>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No participants yet
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      entry.rank <= 3
                        ? "bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/10 border-yellow-200"
                        : "hover:bg-accent"
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={entry.userImage || undefined} />
                      <AvatarFallback>{getInitials(entry.userName || "Anonymous")}</AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{entry.userName || "Anonymous"}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {entry.submittedAt ? (
                          <>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Submitted
                            </span>
                            {contest.shouldShowResults && (
                              <span>
                                {entry.correctSubmissions}/{entry.totalSubmissions} correct
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-yellow-500" />
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    {contest.shouldShowResults ? (
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {entry.score !== null ? entry.score : "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">Points</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            {formatTime(entry.timeSpentSeconds)}
                          </div>
                          <div className="text-xs text-muted-foreground">Time</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground italic">Hidden</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        {contest.shouldShowResults && leaderboard.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Contest Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {leaderboard.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Participants</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {leaderboard.filter((e) => e.submittedAt).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {leaderboard[0]?.score || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
