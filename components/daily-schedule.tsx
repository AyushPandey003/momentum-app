"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ScheduleBlock, Task } from "@/lib/types"
import { getTasks, getSchedule, saveScheduleBlock } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import { generateSmartSchedule, formatTime } from "@/lib/scheduler"
import { Sparkles, Clock, Coffee, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function DailySchedule() {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)
    if (u) {
      const today = new Date().toISOString().split("T")[0]
      setSchedule(getSchedule(u.id, today))
      setTasks(getTasks(u.id))
    }
  }, [])

  const handleGenerateSchedule = async () => {
    if (!user) return

    setIsGenerating(true)

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newSchedule = generateSmartSchedule(tasks, user.preferences)

    // Save schedule blocks
    newSchedule.forEach((block) => {
      const blockWithUserId = { ...block, userId: user.id }
      saveScheduleBlock(user.id, blockWithUserId)
    })

    const today = new Date().toISOString().split("T")[0]
    setSchedule(getSchedule(user.id, today))
    setIsGenerating(false)
  }

  const getBlockIcon = (type: ScheduleBlock["type"]) => {
    switch (type) {
      case "pomodoro":
      case "task":
        return <Clock className="w-4 h-4" />
      case "break":
        return <Coffee className="w-4 h-4" />
      case "wellness":
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getBlockColor = (type: ScheduleBlock["type"]) => {
    switch (type) {
      case "pomodoro":
      case "task":
        return "bg-primary/10 border-primary/20 text-primary"
      case "break":
        return "bg-accent/10 border-accent/20 text-accent-foreground"
      case "wellness":
        return "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
      default:
        return "bg-muted"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Today's Schedule</CardTitle>
          <Button onClick={handleGenerateSchedule} disabled={isGenerating || tasks.length === 0} size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Auto-Schedule"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {schedule.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No schedule yet for today</p>
            <p className="text-sm">Click "Auto-Schedule" to let AI plan your day</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedule.map((block) => {
              const startTime = new Date(block.startTime)
              const endTime = new Date(block.endTime)

              return (
                <div
                  key={block.id}
                  className={cn("flex items-center gap-3 p-3 rounded-lg border", getBlockColor(block.type))}
                >
                  <div className="flex-shrink-0">{getBlockIcon(block.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{block.title}</div>
                    {block.description && <div className="text-xs opacity-80 truncate">{block.description}</div>}
                  </div>

                  <div className="flex-shrink-0 text-sm font-mono">
                    {formatTime(startTime)} - {formatTime(endTime)}
                  </div>

                  {block.status === "completed" && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Done
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
