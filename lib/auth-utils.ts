// Client-side auth utilities for localStorage-based user management
// This is separate from the server-side auth in lib/auth.ts

import type { User } from "./types"
import { authClient } from "./auth-client"
import { useUserStore } from "./stores/user-store"
import { clearAllAppState, validateSessionState } from "./cleanup-utils"

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  return useUserStore.getState().user
}

export function updateUser(updates: Partial<User>) {
  if (typeof window === "undefined") return
  useUserStore.getState().updateUser(updates)
}

export function setUser(user: User) {
  if (typeof window === "undefined") return
  useUserStore.getState().setUser(user)
}

export function clearUser() {
  if (typeof window === "undefined") return
  useUserStore.getState().clearUser()
}

/**
 * Comprehensive signout that clears all application state
 */
export async function signOut() {
  try {
    // Clear all localStorage state before signing out
    clearAllAppState()
    
    // Sign out from auth client
    await authClient.signOut()
    
    // Clear user store (redundant but ensures cleanup)
    clearUser()
    
    console.log('✅ Signout completed with full state cleanup')
  } catch (error) {
    console.error('Error during signout:', error)
    // Even if signout fails, clear local state
    clearAllAppState()
    throw error
  }
}

/**
 * Validates current session state to prevent mismatches
 * Call this after authentication to ensure state is in sync
 */
export function validateAuthState(sessionUserId: string | null | undefined) {
  return validateSessionState(sessionUserId)
}

// Export the hook for components
export { useUserStore }
