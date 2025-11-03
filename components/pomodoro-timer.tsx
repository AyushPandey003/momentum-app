"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, RotateCcw, Coffee } from "lucide-react"
import { getCurrentUser, updateUser } from "@/lib/auth-utils"
import { cn } from "@/lib/utils"

type TimerMode = "work" | "break" | "longBreak"

export function PomodoroTimer() {
  const [user, setUser] = useState<any | null>(null)
  const [mode, setMode] = useState<TimerMode>("work")
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const workTime = (user?.preferences?.pomodoroLength || 25) * 60
  const breakTime = (user?.preferences?.breakLength || 5) * 60
  const longBreakTime = (user?.preferences?.longBreakLength || 15) * 60

  useEffect(() => {
    setTimeLeft(workTime)
  }, [workTime])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            handleTimerComplete()
            return 0
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false)

    if (mode === "work") {
      const newCount = pomodorosCompleted + 1
      setPomodorosCompleted(newCount)

      // Update user stats
      if (user) {
        updateUser({
          stats: {
            ...user.stats,
            pomodorosCompleted: user.stats.pomodorosCompleted + 1,
            totalFocusTime: user.stats.totalFocusTime + (user.preferences.pomodoroLength || 25),
            totalPoints: user.stats.totalPoints + 5,
          },
        })
      }

      // Switch to break
      const isLongBreak = newCount % (user?.preferences.pomodorosUntilLongBreak || 4) === 0
      setMode(isLongBreak ? "longBreak" : "break")
      setTimeLeft(isLongBreak ? longBreakTime : breakTime)
    } else {
      // Switch back to work
      setMode("work")
      setTimeLeft(workTime)
    }

    // Play notification sound (browser notification API)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pomodoro Timer", {
        body: mode === "work" ? "Time for a break!" : "Time to focus!",
      })
    }
  }, [mode, pomodorosCompleted, user, workTime, breakTime, longBreakTime])

  const toggleTimer = () => {
    if (!isRunning && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setMode("work")
    setTimeLeft(workTime)
  }

  const skipToBreak = () => {
    setIsRunning(false)
    setMode("break")
    setTimeLeft(breakTime)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const totalTime = mode === "work" ? workTime : mode === "break" ? breakTime : longBreakTime
  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <Card className={cn(mode === "work" ? "border-primary" : "border-accent")}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{mode === "work" ? "Focus Time" : mode === "break" ? "Short Break" : "Long Break"}</span>
          <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            <Coffee className="w-4 h-4" />
            {pomodorosCompleted} completed
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-6xl font-bold font-mono tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex gap-2 justify-center">
          <Button onClick={toggleTimer} size="lg" className="w-32">
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>

          <Button onClick={resetTimer} variant="outline" size="lg">
            <RotateCcw className="w-4 h-4" />
          </Button>

          {mode === "work" && (
            <Button onClick={skipToBreak} variant="outline" size="lg">
              <Coffee className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {mode === "work" ? "Stay focused on your current task" : "Take a break and recharge"}
        </div>
      </CardContent>
    </Card>
  )
}
