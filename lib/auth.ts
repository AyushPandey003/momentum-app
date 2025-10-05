import type { User, UserPreferences, UserStats } from "./types"

const STORAGE_KEY = "momentum_user"
const USERS_KEY = "momentum_users"

// Default user preferences
const defaultPreferences: UserPreferences = {
  workHoursStart: "09:00",
  workHoursEnd: "17:00",
  pomodoroLength: 25,
  breakLength: 5,
  longBreakLength: 15,
  pomodorosUntilLongBreak: 4,
  enableNotifications: true,
  theme: "dark",
}

// Default user stats
const defaultStats: UserStats = {
  totalPoints: 0,
  level: 1,
  streak: 0,
  tasksCompleted: 0,
  pomodorosCompleted: 0,
  totalFocusTime: 0,
}

// Get all users from localStorage
function getAllUsers(): Record<string, User> {
  if (typeof window === "undefined") return {}
  const users = localStorage.getItem(USERS_KEY)
  return users ? JSON.parse(users) : {}
}

// Save all users to localStorage
function saveAllUsers(users: Record<string, User>) {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Sign up a new user
export function signUp(
  email: string,
  password: string,
  name: string,
): { success: boolean; error?: string; user?: User } {
  const users = getAllUsers()

  // Check if user already exists
  if (Object.values(users).some((u) => u.email === email)) {
    return { success: false, error: "User already exists" }
  }

  // Create new user
  const user: User = {
    id: crypto.randomUUID(),
    email,
    name,
    createdAt: new Date().toISOString(),
    preferences: defaultPreferences,
    stats: defaultStats,
  }

  // Save user
  users[user.id] = user
  saveAllUsers(users)

  // Set as current user
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }

  return { success: true, user }
}

// Sign in an existing user
export function signIn(email: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getAllUsers()
  const user = Object.values(users).find((u) => u.email === email)

  if (!user) {
    return { success: false, error: "Invalid credentials" }
  }

  // Set as current user
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }

  return { success: true, user }
}

// Sign out current user
export function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Get current user
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem(STORAGE_KEY)
  return user ? JSON.parse(user) : null
}

// Update current user
export function updateUser(updates: Partial<User>) {
  const currentUser = getCurrentUser()
  if (!currentUser) return null

  const updatedUser = { ...currentUser, ...updates }

  // Update in users list
  const users = getAllUsers()
  users[updatedUser.id] = updatedUser
  saveAllUsers(users)

  // Update current user
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
  }

  return updatedUser
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
