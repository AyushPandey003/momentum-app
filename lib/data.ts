import type { Task, ScheduleBlock, Achievement, LeaderboardEntry } from "./types"

const TASKS_KEY = "momentum_tasks"
const SCHEDULE_KEY = "momentum_schedule"
const ACHIEVEMENTS_KEY = "momentum_achievements"

// Task management
export function getTasks(userId: string): Task[] {
  if (typeof window === "undefined") return []
  const tasks = localStorage.getItem(`${TASKS_KEY}_${userId}`)
  return tasks ? JSON.parse(tasks) : []
}

export function saveTask(userId: string, task: Task) {
  const tasks = getTasks(userId)
  const index = tasks.findIndex((t) => t.id === task.id)

  if (index >= 0) {
    tasks[index] = task
  } else {
    tasks.push(task)
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${TASKS_KEY}_${userId}`, JSON.stringify(tasks))
  }

  return task
}

export function deleteTask(userId: string, taskId: string) {
  const tasks = getTasks(userId).filter((t) => t.id !== taskId)
  if (typeof window !== "undefined") {
    localStorage.setItem(`${TASKS_KEY}_${userId}`, JSON.stringify(tasks))
  }
}

// Schedule management
export function getSchedule(userId: string, date?: string): ScheduleBlock[] {
  if (typeof window === "undefined") return []
  const schedule = localStorage.getItem(`${SCHEDULE_KEY}_${userId}`)
  const allBlocks: ScheduleBlock[] = schedule ? JSON.parse(schedule) : []

  if (date) {
    return allBlocks.filter((block) => block.startTime.startsWith(date))
  }

  return allBlocks
}

export function saveScheduleBlock(userId: string, block: ScheduleBlock) {
  const schedule = getSchedule(userId)
  const index = schedule.findIndex((b) => b.id === block.id)

  if (index >= 0) {
    schedule[index] = block
  } else {
    schedule.push(block)
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${SCHEDULE_KEY}_${userId}`, JSON.stringify(schedule))
  }

  return block
}

// Achievements
export function getAchievements(userId: string): Achievement[] {
  if (typeof window === "undefined") return []
  const achievements = localStorage.getItem(`${ACHIEVEMENTS_KEY}_${userId}`)
  return achievements ? JSON.parse(achievements) : getDefaultAchievements()
}

function getDefaultAchievements(): Achievement[] {
  return [
    { id: "1", title: "First Task", description: "Complete your first task", icon: "🎯", points: 10 },
    { id: "2", title: "Pomodoro Master", description: "Complete 10 pomodoros", icon: "🍅", points: 50 },
    { id: "3", title: "Week Warrior", description: "Maintain a 7-day streak", icon: "🔥", points: 100 },
    { id: "4", title: "Early Bird", description: "Complete a task before 9 AM", icon: "🌅", points: 25 },
    { id: "5", title: "Night Owl", description: "Complete a task after 10 PM", icon: "🦉", points: 25 },
  ]
}

// Mock leaderboard data
export function getLeaderboard(): LeaderboardEntry[] {
  return [
    { userId: "1", userName: "Alex Chen", points: 2450, level: 12, rank: 1, streak: 15 },
    { userId: "2", userName: "Sarah Johnson", points: 2100, level: 11, rank: 2, streak: 8 },
    { userId: "3", userName: "Mike Rodriguez", points: 1890, level: 10, rank: 3, streak: 12 },
    { userId: "4", userName: "Emma Davis", points: 1650, level: 9, rank: 4, streak: 5 },
    { userId: "5", userName: "James Wilson", points: 1420, level: 8, rank: 5, streak: 7 },
  ]
}
