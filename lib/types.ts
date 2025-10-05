// User types
export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  achievements?: string[]
  preferences: UserPreferences
  stats: UserStats
}

export interface UserPreferences {
  workHoursStart: string // "09:00"
  workHoursEnd: string // "17:00"
  pomodoroLength: number // minutes
  breakLength: number // minutes
  longBreakLength: number // minutes
  pomodorosUntilLongBreak: number
  enableNotifications?: boolean
  notificationsEnabled?: boolean
  wellnessReminders?: boolean
  wellnessReminderInterval?: number
  theme: "light" | "dark" | "system"
}

export interface UserStats {
  totalPoints: number
  level: number
  streak: number
  currentStreak?: number
  longestStreak?: number
  tasksCompleted: number
  pomodorosCompleted: number
  totalFocusTime: number // minutes
}

// Task types
export interface Task {
  id: string
  userId: string
  title: string
  description: string
  dueDate: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "todo" | "in-progress" | "completed" | "overdue"
  estimatedTime: number // minutes
  actualTime: number // minutes
  tags: string[]
  subtasks: Subtask[]
  source: "manual" | "lms" | "calendar"
  sourceId?: string
  createdAt: string
  completedAt?: string
  aiDecomposed: boolean
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  estimatedTime: number // minutes
}

// Schedule types
export interface ScheduleBlock {
  id: string
  userId: string
  taskId?: string
  title: string
  description?: string
  startTime: string
  endTime: string
  type: "task" | "break" | "wellness" | "event" | "pomodoro"
  status: "scheduled" | "in-progress" | "completed" | "skipped"
  pomodoroCount?: number
  createdAt: string
}

// Calendar integration types
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  source: "google" | "outlook" | "apple"
}

// LMS integration types
export interface LMSAssignment {
  id: string
  courseId: string
  courseName: string
  title: string
  description: string
  dueDate: string
  submissionType: string
  points: number
  submitted: boolean
}

// Procrastination detection types
export interface ProcrastinationAlert {
  id: string
  userId: string
  taskId: string
  type: "deadline-approaching" | "task-avoided" | "pattern-detected"
  message: string
  severity: "low" | "medium" | "high"
  createdAt: string
  dismissed: boolean
}

// Gamification types
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
  unlockedAt?: string
  requirement?: {
    type: "tasksCompleted" | "pomodorosCompleted" | "currentStreak" | "totalFocusTime" | "special"
    value: number | string
  }
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  points: number
  level: number
  rank: number
  streak: number
}

// Wellness types
export interface WellnessActivity {
  id: string
  type: "exercise" | "meditation" | "break" | "sleep"
  title: string
  duration: number // minutes
  scheduledTime?: string
  completedAt?: string
}
