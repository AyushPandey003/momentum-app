"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, Crown } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getLeaderboard, ACHIEVEMENTS } from "@/lib/gamification"
import { AchievementCard } from "@/components/achievement-card"
import { LevelProgress } from "@/components/level-progress"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<User[]>([])
  const currentUser = getCurrentUser()

  useEffect(() => {
    setLeaderboard(getLeaderboard())
  }, [])

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

  const userAchievements = currentUser?.achievements ?? []
  const unlockedAchievements = currentUser ? ACHIEVEMENTS.filter((a) => userAchievements.includes(a.id)) : []
  const lockedAchievements = currentUser ? ACHIEVEMENTS.filter((a) => !userAchievements.includes(a.id)) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard & Achievements</h1>
        <p className="text-muted-foreground">Compete with others and unlock achievements</p>
      </div>

      <LevelProgress />

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
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

                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>

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
