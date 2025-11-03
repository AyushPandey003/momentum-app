// Client-side auth utilities for localStorage-based user management
// This is separate from the server-side auth in lib/auth.ts

import type { User } from "./types"
import { authClient } from "./auth-client"
import { useUserStore } from "./stores/user-store"

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

export async function signOut() {
  await authClient.signOut()
  clearUser()
}

// Export the hook for components
export { useUserStore }
