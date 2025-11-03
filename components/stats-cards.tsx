"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Clock, Flame, Trophy } from "lucide-react"
import { getCurrentUser } from "@/lib/auth-utils"
import { getTasks } from "@/lib/data"

export function StatsCards() {
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    totalPoints: 0,
    streak: 0,
    focusTime: 0,
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      const tasks = getTasks(user.id)
      const completedTasks = tasks.filter((t) => t.status === "completed").length

      setStats({
        tasksCompleted: completedTasks,
        totalPoints: user.stats.totalPoints,
        streak: user.stats.streak,
        focusTime: user.stats.totalFocusTime,
      })
    }
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
          <p className="text-xs text-muted-foreground">Keep up the momentum!</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPoints}</div>
          <p className="text-xs text-muted-foreground">Earn more by completing tasks</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.streak} days</div>
          <p className="text-xs text-muted-foreground">Don't break the chain!</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.floor(stats.focusTime / 60)}h {stats.focusTime % 60}m
          </div>
          <p className="text-xs text-muted-foreground">Time well spent</p>
        </CardContent>
      </Card>
    </div>
  )
}
