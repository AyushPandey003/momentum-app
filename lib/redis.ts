import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Redis client only if credentials are available
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  // Rate limiting: 10 requests per 10 seconds
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
  })
}

// Cache helper functions
export const cache = {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null
    try {
      const value = await redis.get<T>(key)
      return value
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  },

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!redis) return false
    try {
      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value))
      } else {
        await redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  },

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!redis) return false
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Redis del error:', error)
      return false
    }
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!redis) return false
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  },

  /**
   * Set expiration time for a key (in seconds)
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!redis) return false
    try {
      await redis.expire(key, seconds)
      return true
    } catch (error) {
      console.error('Redis expire error:', error)
      return false
    }
  },

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number | null> {
    if (!redis) return null
    try {
      return await redis.incr(key)
    } catch (error) {
      console.error('Redis incr error:', error)
      return null
    }
  },

  /**
   * Get multiple keys at once
   */
  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    if (!redis) return keys.map(() => null)
    try {
      const values = await redis.mget(...keys)
      return values as (T | null)[]
    } catch (error) {
      console.error('Redis mget error:', error)
      return keys.map(() => null)
    }
  },

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!redis) return []
    try {
      return await redis.keys(pattern)
    } catch (error) {
      console.error('Redis keys error:', error)
      return []
    }
  },
}

// Rate limiting helper
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  if (!ratelimit) {
    return { success: true, limit: 10, remaining: 10, reset: Date.now() }
  }

  try {
    const result = await ratelimit.limit(identifier)
    return result
  } catch (error) {
    console.error('Rate limit error:', error)
    return { success: true, limit: 10, remaining: 10, reset: Date.now() }
  }
}

// Cache key generators for consistent naming
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userStats: (userId: string) => `user:${userId}:stats`,
  userPreferences: (userId: string) => `user:${userId}:preferences`,
  userTasks: (userId: string) => `user:${userId}:tasks`,
  userSchedule: (userId: string, date?: string) => 
    date ? `user:${userId}:schedule:${date}` : `user:${userId}:schedule`,
  userAchievements: (userId: string) => `user:${userId}:achievements`,
  leaderboard: () => `leaderboard:global`,
  session: (sessionId: string) => `session:${sessionId}`,
}

export { redis, ratelimit }
