import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Achievement } from '@/lib/types'

interface AchievementState {
  achievements: Record<string, Achievement[]> // userId -> achievements[]
  newAchievements: Achievement[]
  getAchievements: (userId: string) => Achievement[]
  addAchievement: (userId: string, achievement: Achievement) => void
  setNewAchievements: (achievements: Achievement[]) => void
  clearNewAchievements: () => void
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: {},
      newAchievements: [],
      getAchievements: (userId) => get().achievements[userId] || [],
      addAchievement: (userId, achievement) =>
        set((state) => ({
          achievements: {
            ...state.achievements,
            [userId]: [...(state.achievements[userId] || []), achievement],
          },
        })),
      setNewAchievements: (achievements) => set({ newAchievements: achievements }),
      clearNewAchievements: () => set({ newAchievements: [] }),
    }),
    {
      name: 'momentum-achievements-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
