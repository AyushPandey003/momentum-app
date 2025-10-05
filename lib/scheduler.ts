import type { Task, ScheduleBlock, UserPreferences } from "./types"

export function generateSmartSchedule(
  tasks: Task[],
  preferences: UserPreferences,
  date: Date = new Date(),
): ScheduleBlock[] {
  const schedule: ScheduleBlock[] = []

  // Filter incomplete tasks and sort by priority and due date
  const incompleteTasks = tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      // Priority order: urgent > high > medium > low
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Then sort by due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

  // Parse work hours
  const [startHour, startMinute] = preferences.workHoursStart.split(":").map(Number)
  const [endHour, endMinute] = preferences.workHoursEnd.split(":").map(Number)

  let currentTime = new Date(date)
  currentTime.setHours(startHour, startMinute, 0, 0)

  const endTime = new Date(date)
  endTime.setHours(endHour, endMinute, 0, 0)

  let pomodoroCount = 0

  for (const task of incompleteTasks) {
    // Check if we have time left in the day
    if (currentTime >= endTime) break

    // Calculate how many pomodoros needed for this task
    const pomodorosNeeded = Math.ceil(task.estimatedTime / preferences.pomodoroLength)

    for (let i = 0; i < pomodorosNeeded; i++) {
      if (currentTime >= endTime) break

      // Schedule pomodoro work block
      const blockStart = new Date(currentTime)
      const blockEnd = new Date(currentTime.getTime() + preferences.pomodoroLength * 60000)

      schedule.push({
        id: crypto.randomUUID(),
        userId: "",
        taskId: task.id,
        title: task.title,
        description: `Pomodoro ${i + 1}/${pomodorosNeeded}`,
        startTime: blockStart.toISOString(),
        endTime: blockEnd.toISOString(),
        type: "pomodoro",
        status: "scheduled",
        pomodoroCount: i + 1,
        createdAt: new Date().toISOString(),
      })

      currentTime = blockEnd
      pomodoroCount++

      // Add break after pomodoro
      const isLongBreak = pomodoroCount % preferences.pomodorosUntilLongBreak === 0
      const breakLength = isLongBreak ? preferences.longBreakLength : preferences.breakLength

      const breakEnd = new Date(currentTime.getTime() + breakLength * 60000)

      schedule.push({
        id: crypto.randomUUID(),
        userId: "",
        title: isLongBreak ? "Long Break" : "Short Break",
        startTime: currentTime.toISOString(),
        endTime: breakEnd.toISOString(),
        type: "break",
        status: "scheduled",
        createdAt: new Date().toISOString(),
      })

      currentTime = breakEnd
    }
  }

  return schedule
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

export function getTimeRemaining(endTime: string): { minutes: number; seconds: number; total: number } {
  const total = new Date(endTime).getTime() - Date.now()
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const seconds = Math.floor((total / 1000) % 60)

  return { minutes: Math.max(0, minutes), seconds: Math.max(0, seconds), total: Math.max(0, total) }
}
