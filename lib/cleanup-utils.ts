// Comprehensive cleanup utilities for localStorage and state management
// Prevents state mismatches during authentication and after signout/game finish

/**
 * All localStorage keys used in the application
 */
const STORAGE_KEYS = {
  USER_STORE: 'momentum-user-storage',
  TASK_STORE: 'momentum-task-storage',
  SCHEDULE_STORE: 'momentum-schedule-storage',
  ACHIEVEMENT_STORE: 'momentum-achievement-storage',
  WELLNESS_REMINDER: 'lastWellnessReminder',
  CONTEST_TOKEN: 'contest-token-cache', // Custom key for contest tokens
  GAME_STATE: 'contest-game-state', // Custom key for game state
} as const;

/**
 * Clears all application state from localStorage
 * Should be called on signout
 */
export function clearAllAppState() {
  if (typeof window === 'undefined') return;

  try {
    // Clear all zustand stores
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear any other potential localStorage items with momentum prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('momentum-') || key.startsWith('contest-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log('✅ Cleared all application state from localStorage');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

/**
 * Clears contest/game specific state
 * Should be called when game finishes or user leaves contest
 */
export function clearContestState() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.CONTEST_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    
    // Clear any contest-related sessionStorage
    sessionStorage.removeItem('contest-token');
    sessionStorage.removeItem('game-state');
    sessionStorage.removeItem('websocket-state');

    console.log('✅ Cleared contest/game state');
  } catch (error) {
    console.error('Error clearing contest state:', error);
  }
}

/**
 * Validates and syncs user session state
 * Should be called on authentication to prevent state mismatches
 */
export function validateSessionState(sessionUserId: string | null | undefined) {
  if (typeof window === 'undefined') return false;

  try {
    // Get stored user from localStorage
    const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_STORE);
    
    if (!storedUserData) {
      // No stored user, session might be fresh - this is okay
      return true;
    }

    const parsed = JSON.parse(storedUserData);
    const storedUserId = parsed?.state?.user?.id;

    // If session user doesn't match stored user, clear state
    if (sessionUserId && storedUserId && sessionUserId !== storedUserId) {
      console.warn('⚠️ Session user mismatch detected. Clearing state.');
      clearAllAppState();
      return false;
    }

    // If session is null but we have stored user, clear state
    if (!sessionUserId && storedUserId) {
      console.warn('⚠️ Session expired but user state exists. Clearing state.');
      clearAllAppState();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating session state:', error);
    // On error, clear state to be safe
    clearAllAppState();
    return false;
  }
}

/**
 * Clears user-specific state but keeps app preferences
 * Use this for switching users without losing all settings
 */
export function clearUserState() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.USER_STORE);
    localStorage.removeItem(STORAGE_KEYS.CONTEST_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    
    console.log('✅ Cleared user-specific state');
  } catch (error) {
    console.error('Error clearing user state:', error);
  }
}

/**
 * Gets a cached contest token from localStorage
 */
export function getCachedContestToken(contestId: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.CONTEST_TOKEN);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    // Check if token is for the same contest and not expired (tokens typically expire in 1 hour)
    if (parsed.contestId === contestId && parsed.expiresAt > Date.now()) {
      return parsed.token;
    }
    
    // Token expired or for different contest, remove it
    localStorage.removeItem(STORAGE_KEYS.CONTEST_TOKEN);
    return null;
  } catch (error) {
    console.error('Error getting cached token:', error);
    return null;
  }
}

/**
 * Caches a contest token in localStorage
 */
export function cacheContestToken(contestId: string, token: string, expiresInMs: number = 3600000) {
  if (typeof window === 'undefined') return;

  try {
    const data = {
      contestId,
      token,
      expiresAt: Date.now() + expiresInMs,
    };
    localStorage.setItem(STORAGE_KEYS.CONTEST_TOKEN, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching token:', error);
  }
}

