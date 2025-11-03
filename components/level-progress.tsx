"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, TrendingUp } from "lucide-react"
import { getCurrentUser } from "@/lib/auth-utils"
import { getProgressToNextLevel, getPointsForNextLevel } from "@/lib/gamification"

export function LevelProgress() {
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  if (!user) return null

  const progress = getProgressToNextLevel(user.stats.totalPoints)
  const pointsNeeded = getPointsForNextLevel(user.stats.level)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Level Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">Level {user.stats.level}</div>
            <div className="text-sm text-muted-foreground">{user.stats.totalPoints} total points</div>
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {user.stats.level + 1}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="text-xs text-muted-foreground text-right">
            {pointsNeeded - user.stats.totalPoints} points needed
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
