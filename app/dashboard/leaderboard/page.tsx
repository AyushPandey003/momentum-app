"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, Crown, Users, Calendar, Target, ArrowRight, Eye, Clock } from "lucide-react"
import { getCurrentUser } from "@/lib/auth-utils"
import { getLeaderboard, ACHIEVEMENTS } from "@/lib/gamification"
import { getGlobalLeaderboard } from "@/server/users"
import { AchievementCard } from "@/components/achievement-card"
import { LevelProgress } from "@/components/level-progress"
import { CreateContestDialog } from "@/components/create-contest-dialog"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getActiveContests, getUserContests, getCompletedContests, getContestLeaderboard } from "@/server/contests"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<User[]>([])
  const [contests, setContests] = useState<any[]>([])
  const [userContests, setUserContests] = useState<any[]>([])
  const [completedContests, setCompletedContests] = useState<any[]>([])
  const [userStats, setUserStats] = useState<{totalContests: number, totalScore: number, averageScore: number, bestRank: number | null}>({ totalContests: 0, totalScore: 0, averageScore: 0, bestRank: null })
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<{unlocked: any[], locked: any[]}>({ unlocked: [], locked: [] })
  const currentUser = getCurrentUser()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    const loadData = async () => {
      // Load real leaderboard data from database
      try {
        const dbLeaderboard = await getGlobalLeaderboard(50)
        setLeaderboard(dbLeaderboard)
      } catch (error) {
        console.error("Error loading leaderboard:", error)
        // Fallback to local data
        setLeaderboard(getLeaderboard())
      }
      
      // Load achievements from API
      try {
        const achievementsRes = await fetch("/api/achievements")
        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json()
          setAchievements(achievementsData)
        }
      } catch (error) {
        console.error("Error loading achievements:", error)
      }
      
      if (currentUser) {
        try {
          const [activeContests, myContests, pastContests] = await Promise.all([
            getActiveContests(),
            getUserContests(currentUser.id),
            getCompletedContests(currentUser.id)
          ])
          setContests(activeContests)
          setUserContests(myContests)
          setCompletedContests(pastContests)

          // Calculate user statistics and enrich completed contests with user data
          const contestsWithScores = await Promise.all(
            pastContests.map(async (contest: any) => {
              try {
                const leaderboardData = await getContestLeaderboard(contest.id)
                const userEntry = leaderboardData.leaderboard.find((entry: any) => entry.userId === currentUser.id)
                
                // Enrich contest with user score and rank
                if (userEntry) {
                  contest.userScore = userEntry.score
                  contest.userRank = userEntry.rank
                  contest.participantCount = leaderboardData.leaderboard.length
                }
                
                return userEntry ? { score: userEntry.score || 0, rank: userEntry.rank } : null
              } catch (error) {
                console.error(`Error loading leaderboard for contest ${contest.id}:`, error)
                return null
              }
            })
          )

          const validContests = contestsWithScores.filter((c): c is { score: number; rank: number } => c !== null)
          const totalScore = validContests.reduce((sum, c) => sum + c.score, 0)
          const bestRank = validContests.length > 0 ? Math.min(...validContests.map(c => c.rank)) : null

          setUserStats({
            totalContests: validContests.length,
            totalScore,
            averageScore: validContests.length > 0 ? Math.round(totalScore / validContests.length) : 0,
            bestRank
          })
          
          // Update completed contests state with enriched data
          setCompletedContests(pastContests)
        } catch (error) {
          console.error("Error loading contests:", error)
        }
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [currentUser])

  useEffect(() => {
    // Show toast messages based on URL params
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    const contestName = searchParams.get("contest")

    if (success === "joined" && contestName) {
      toast({
        title: "Welcome to the contest! 🎉",
        description: `You've successfully joined ${contestName}`,
      })
    } else if (success === "already_joined") {
      toast({
        title: "Already a member",
        description: "You're already participating in this contest",
      })
    } else if (error === "invalid_invitation") {
      toast({
        title: "Invalid Invitation",
        description: "This invitation link is not valid",
        variant: "destructive",
      })
    } else if (error === "invitation_expired") {
      toast({
        title: "Invitation Expired",
        description: "This invitation has expired. Please request a new one.",
        variant: "destructive",
      })
    } else if (error === "invitation_declined") {
      toast({
        title: "Invitation Declined",
        description: "This invitation was previously declined",
        variant: "destructive",
      })
    } else if (error === "something_went_wrong") {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-muted-foreground font-semibold">#{rank}</span>
    }
  }

  // Combine API achievements (contest) with all ACHIEVEMENTS
  // API returns contest achievements with unlock status, we merge with all achievements
  const apiUnlockedIds = new Set(achievements.unlocked.map((a: any) => a.id));
  const apiLockedIds = new Set(achievements.locked.map((a: any) => a.id));
  const userAchievementIds = new Set(currentUser?.achievements ?? []);
  
  // For each achievement, check if it's unlocked via API or user data
  const allAchievementsWithStatus = ACHIEVEMENTS.map(ach => {
    if (apiUnlockedIds.has(ach.id)) {
      return { ...ach, unlocked: true };
    }
    if (apiLockedIds.has(ach.id)) {
      return { ...ach, unlocked: false };
    }
    // For non-contest achievements, check local user data
    return { 
      ...ach, 
      unlocked: userAchievementIds.has(ach.id)
    };
  });
  
  const unlockedAchievements = allAchievementsWithStatus.filter(a => a.unlocked);
  const lockedAchievements = allAchievementsWithStatus.filter(a => !a.unlocked);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard & Achievements</h1>
          <p className="text-muted-foreground">Compete with others and unlock achievements</p>
        </div>
        <CreateContestDialog userContestCount={userContests.length} />
      </div>

      <LevelProgress />

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="contests">
            <Target className="w-4 h-4 mr-2" />
            Contests
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user, index) => {
                  const rank = index + 1
                  const isCurrentUser = user.id === currentUser?.id

                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border",
                        isCurrentUser && "bg-primary/5 border-primary/20",
                        rank === 1 && "bg-yellow-500/5 border-yellow-500/20",
                      )}
                    >
                      <div className="flex items-center justify-center w-10">{getRankIcon(rank)}</div>

                      {user.image ? (
                        <img 
                          src={user.image} 
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg border-2 border-primary/20">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{user.name}</h3>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Level {user.stats.level}</span>
                          <span>•</span>
                          <span>{user.stats.tasksCompleted} tasks</span>
                          <span>•</span>
                          <span>{user.stats.currentStreak} day streak</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{user.stats.totalPoints}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contests" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading contests...
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* User Stats Card */}
              {currentUser && userStats.totalContests > 0 && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-blue-600" />
                      My Contest Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-background rounded-lg border">
                        <div className="text-3xl font-bold text-primary">{userStats.totalContests}</div>
                        <div className="text-sm text-muted-foreground mt-1">Contests Completed</div>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg border">
                        <div className="text-3xl font-bold text-primary">{userStats.totalScore}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Points</div>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg border">
                        <div className="text-3xl font-bold text-primary">{userStats.averageScore}</div>
                        <div className="text-sm text-muted-foreground mt-1">Average Score</div>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg border">
                        <div className="text-3xl font-bold text-primary">
                          {userStats.bestRank ? `#${userStats.bestRank}` : "—"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Best Rank</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {contests.length === 0 && userContests.length === 0 && completedContests.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Contests Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a contest to compete with others!
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Active Contests */}
              {contests.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Active Contests</h2>
                    <Badge variant="default">{contests.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {contests.map((contest: any) => (
                      <Card key={contest.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="truncate">{contest.name}</span>
                            <Badge variant="destructive">Live</Badge>
                          </CardTitle>
                          {contest.description && (
                            <CardDescription className="line-clamp-2">{contest.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{contest.participantCount || 0} participants</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{contest.durationMinutes} minutes</span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full" 
                            onClick={() => router.push(`/dashboard/contest/${contest.id}/leaderboard`)}
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            View Leaderboard
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Contests */}
              {completedContests.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Completed Contests</h2>
                    <Badge variant="outline">{completedContests.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {completedContests.map((contest: any) => (
                      <Card key={contest.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="truncate">{contest.name}</span>
                            <Badge variant="secondary">Finished</Badge>
                          </CardTitle>
                          {contest.description && (
                            <CardDescription className="line-clamp-2">{contest.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{contest.participantCount || 0} participants</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {contest.completedAt 
                                ? new Date(contest.completedAt).toLocaleDateString()
                                : new Date(contest.endDate).toLocaleDateString()
                              }
                            </span>
                          </div>
                          {contest.userScore !== undefined && contest.userScore !== null && (
                            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                              <Trophy className="w-4 h-4" />
                              <span>Your Score: {contest.userScore}</span>
                            </div>
                          )}
                          {contest.userRank && (
                            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                              <Target className="w-4 h-4" />
                              <span>Your Rank: #{contest.userRank}</span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline"
                            className="w-full" 
                            onClick={() => router.push(`/dashboard/contest/${contest.id}/leaderboard`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Results
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {unlockedAchievements.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Unlocked</h2>
                <Badge variant="outline">{unlockedAchievements.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unlockedAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} unlocked={true} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Locked</h2>
              <Badge variant="outline">{lockedAchievements.length}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} unlocked={false} />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
