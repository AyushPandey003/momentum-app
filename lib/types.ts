// Database User types (from schema)
export interface DbUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}

// Application User types (extended with app-specific data)
export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  achievements?: string[]
  preferences: UserPreferences
  stats: UserStats
  emailVerified?: boolean
  image?: string | null
  updatedAt?: string
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

// Database types (from schema)
export interface Session {
  id: string
  expiresAt: Date
  token: string
  createdAt: Date
  updatedAt: Date
  ipAddress: string | null
  userAgent: string | null
  userId: string
  activeOrganizationId: string | null
}

export interface Account {
  id: string
  accountId: string
  providerId: string
  userId: string
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  accessTokenExpiresAt: Date | null
  refreshTokenExpiresAt: Date | null
  scope: string | null
  password: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Verification {
  id: string
  identifier: string
  value: string
  expiresAt: Date
  createdAt: Date | null
  updatedAt: Date | null
}

export interface Organization {
  id: string
  name: string
  slug: string | null
  logo: string | null
  createdAt: Date
  metadata: string | null
}

export type Role = "member" | "admin" | "owner"

export interface Member {
  id: string
  organizationId: string
  userId: string
  role: Role
  createdAt: Date
}

export interface MemberWithUser extends Member {
  user: DbUser
}

export interface Invitation {
  id: string
  organizationId: string
  email: string
  role: string | null
  status: string
  expiresAt: Date
  inviterId: string
}
