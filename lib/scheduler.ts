import type { Task, ScheduleBlock, UserPreferences } from "./types"

export async function generateSmartSchedule(
  tasks: Task[],
  preferences: UserPreferences,
  date: Date = new Date(),
): Promise<ScheduleBlock[]> {
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

  // Simple scheduling: create one block per task (split into pomodoro-sized chunks is optional)
  for (const task of incompleteTasks) {
    if (currentTime >= endTime) break

    const estimated = Math.max(15, task.estimatedTime || 30) // minimum 15 minutes
    const remainingMinutes = Math.max(0, Math.round((endTime.getTime() - currentTime.getTime()) / 60000))
    if (remainingMinutes <= 0) break

    const duration = Math.min(estimated, remainingMinutes)

    const blockStart = new Date(currentTime)
    const blockEnd = new Date(blockStart.getTime() + duration * 60 * 1000)

    const block: ScheduleBlock = {
      id: `${task.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: "", // placeholder; caller should add real userId when saving
      taskId: task.id,
      title: task.title,
      description: task.description,
      startTime: blockStart.toISOString(),
      endTime: blockEnd.toISOString(),
      type: "task",
      status: "scheduled",
      pomodoroCount: pomodoroCount + 1,
      createdAt: new Date().toISOString(),
    }

    schedule.push(block)

    // Note: calendar integration (creating events) is server-side only and
    // should not be imported here because this module is used from client
    // components. If you want to create calendar events, call a server API
    // or run a server-side helper with access to Google APIs.

    currentTime = blockEnd
    pomodoroCount++

    // Optionally schedule a short break between tasks if time remains
    const wantsBreak = preferences.breakLength && preferences.breakLength > 0
    if (wantsBreak && currentTime < endTime) {
      const isLongBreak =
        preferences.pomodorosUntilLongBreak && preferences.pomodorosUntilLongBreak > 0
          ? pomodoroCount % preferences.pomodorosUntilLongBreak === 0
          : false

      const breakMinutes = isLongBreak ? preferences.longBreakLength || preferences.breakLength : preferences.breakLength
      const breakEnd = new Date(currentTime.getTime() + breakMinutes * 60 * 1000)

      if (breakEnd <= endTime) {
        const breakBlock: ScheduleBlock = {
          id: `break-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: "",
          title: isLongBreak ? "Long Break" : "Break",
          description: isLongBreak ? "Long restorative break" : "Short break",
          startTime: currentTime.toISOString(),
          endTime: breakEnd.toISOString(),
          type: "break",
          status: "scheduled",
          createdAt: new Date().toISOString(),
        }

        schedule.push(breakBlock)

        // calendar event creation intentionally omitted in client-side scheduler

        currentTime = breakEnd
      }
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
