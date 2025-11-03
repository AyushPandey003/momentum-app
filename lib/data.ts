import type { Task, ScheduleBlock, Achievement, LeaderboardEntry } from "./types"
import { useTaskStore } from "./stores/task-store"
import { useScheduleStore } from "./stores/schedule-store"
import { useAchievementStore } from "./stores/achievement-store"

// Task management
export function getTasks(userId: string): Task[] {
  if (typeof window === "undefined") return []
  return useTaskStore.getState().getTasks(userId)
}

export function saveTask(userId: string, task: Task) {
  if (typeof window === "undefined") return task
  
  const store = useTaskStore.getState()
  const tasks = store.getTasks(userId)
  const index = tasks.findIndex((t) => t.id === task.id)

  if (index >= 0) {
    store.updateTask(userId, task.id, task)
  } else {
    store.addTask(userId, task)
  }

  return task
}

export function deleteTask(userId: string, taskId: string) {
  if (typeof window === "undefined") return
  useTaskStore.getState().deleteTask(userId, taskId)
}

// Schedule management
export function getSchedule(userId: string, date?: string): ScheduleBlock[] {
  if (typeof window === "undefined") return []
  return useScheduleStore.getState().getSchedule(userId, date)
}

export function saveScheduleBlock(userId: string, block: ScheduleBlock) {
  if (typeof window === "undefined") return block
  
  const store = useScheduleStore.getState()
  const schedules = store.getSchedule(userId)
  const index = schedules.findIndex((b) => b.id === block.id)

  if (index >= 0) {
    store.updateScheduleBlock(userId, block.id, block)
  } else {
    store.addScheduleBlock(userId, block)
  }

  return block
}

// Achievements
export function getAchievements(userId: string): Achievement[] {
  if (typeof window === "undefined") return []
  const achievements = useAchievementStore.getState().getAchievements(userId)
  return achievements.length > 0 ? achievements : getDefaultAchievements()
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
