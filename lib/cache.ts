/**
 * Server-side caching utilities with Redis and database fallback
 * This provides a consistent caching layer for server-side operations
 */

import { cache, cacheKeys } from './redis'
import { db } from '@/db/drizzle'
import { user, userStats, userPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { User, UserStats, UserPreferences } from './types'

const DEFAULT_TTL = 300 // 5 minutes

/**
 * Get user with caching
 */
export async function getCachedUser(userId: string): Promise<User | null> {
  // Try cache first
  const cacheKey = cacheKeys.user(userId)
  const cached = await cache.get<User>(cacheKey)
  if (cached) return cached

  // Fallback to database
  try {
    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    })

    if (!dbUser) return null

    // Get stats and preferences
    const [stats, preferences] = await Promise.all([
      getCachedUserStats(userId),
      getCachedUserPreferences(userId),
    ])

    const fullUser: User = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      emailVerified: dbUser.emailVerified,
      image: dbUser.image,
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
      stats: stats || {
        totalPoints: 0,
        level: 1,
        streak: 0,
        currentStreak: 0,
        longestStreak: 0,
        tasksCompleted: 0,
        pomodorosCompleted: 0,
        totalFocusTime: 0,
      },
      preferences: preferences || {
        workHoursStart: '09:00',
        workHoursEnd: '17:00',
        pomodoroLength: 25,
        breakLength: 5,
        longBreakLength: 15,
        pomodorosUntilLongBreak: 4,
        enableNotifications: true,
        notificationsEnabled: true,
        wellnessReminders: true,
        wellnessReminderInterval: 30,
        theme: 'system',
      },
    }

    // Cache the result
    await cache.set(cacheKey, fullUser, DEFAULT_TTL)

    return fullUser
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Get user stats with caching
 */
export async function getCachedUserStats(userId: string): Promise<UserStats | null> {
  const cacheKey = cacheKeys.userStats(userId)
  const cached = await cache.get<UserStats>(cacheKey)
  if (cached) return cached

  try {
    const stats = await db.query.userStats.findFirst({
      where: eq(userStats.userId, userId),
    })

    if (!stats) return null

    const statsData: UserStats = {
      totalPoints: stats.totalPoints,
      level: stats.level,
      streak: stats.streak,
      currentStreak: stats.currentStreak ?? 0,
      longestStreak: stats.longestStreak ?? 0,
      tasksCompleted: stats.tasksCompleted,
      pomodorosCompleted: stats.pomodorosCompleted,
      totalFocusTime: stats.totalFocusTime,
    }

    await cache.set(cacheKey, statsData, DEFAULT_TTL)
    return statsData
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return null
  }
}

/**
 * Get user preferences with caching
 */
export async function getCachedUserPreferences(userId: string): Promise<UserPreferences | null> {
  const cacheKey = cacheKeys.userPreferences(userId)
  const cached = await cache.get<UserPreferences>(cacheKey)
  if (cached) return cached

  try {
    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    })

    if (!prefs) return null

    const prefsData: UserPreferences = {
      workHoursStart: prefs.workHoursStart,
      workHoursEnd: prefs.workHoursEnd,
      pomodoroLength: prefs.pomodoroLength,
      breakLength: prefs.breakLength,
      longBreakLength: prefs.longBreakLength,
      pomodorosUntilLongBreak: prefs.pomodorosUntilLongBreak,
      enableNotifications: prefs.enableNotifications ?? true,
      notificationsEnabled: prefs.notificationsEnabled ?? true,
      wellnessReminders: prefs.wellnessReminders ?? true,
      wellnessReminderInterval: prefs.wellnessReminderInterval ?? 30,
      theme: (prefs.theme as 'light' | 'dark' | 'system') || 'system',
    }

    await cache.set(cacheKey, prefsData, DEFAULT_TTL)
    return prefsData
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return null
  }
}

/**
 * Invalidate user cache
 */
export async function invalidateUserCache(userId: string) {
  await Promise.all([
    cache.del(cacheKeys.user(userId)),
    cache.del(cacheKeys.userStats(userId)),
    cache.del(cacheKeys.userPreferences(userId)),
    cache.del(cacheKeys.userTasks(userId)),
    cache.del(cacheKeys.userSchedule(userId)),
    cache.del(cacheKeys.userAchievements(userId)),
  ])
}

/**
 * Invalidate specific cache keys by pattern
 */
export async function invalidateCachePattern(pattern: string) {
  const keys = await cache.keys(pattern)
  await Promise.all(keys.map((key) => cache.del(key)))
}
