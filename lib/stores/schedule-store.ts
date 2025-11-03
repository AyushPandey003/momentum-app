import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ScheduleBlock } from '@/lib/types'

interface ScheduleState {
  schedules: Record<string, ScheduleBlock[]> // userId -> scheduleBlocks[]
  getSchedule: (userId: string, date?: string) => ScheduleBlock[]
  addScheduleBlock: (userId: string, block: ScheduleBlock) => void
  updateScheduleBlock: (userId: string, blockId: string, updates: Partial<ScheduleBlock>) => void
  deleteScheduleBlock: (userId: string, blockId: string) => void
  setSchedule: (userId: string, blocks: ScheduleBlock[]) => void
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: {},
      getSchedule: (userId, date?) => {
        const allBlocks = get().schedules[userId] || []
        if (date) {
          return allBlocks.filter((block) => block.startTime.startsWith(date))
        }
        return allBlocks
      },
      addScheduleBlock: (userId, block) =>
        set((state) => ({
          schedules: {
            ...state.schedules,
            [userId]: [...(state.schedules[userId] || []), block],
          },
        })),
      updateScheduleBlock: (userId, blockId, updates) =>
        set((state) => ({
          schedules: {
            ...state.schedules,
            [userId]: (state.schedules[userId] || []).map((block) =>
              block.id === blockId ? { ...block, ...updates } : block
            ),
          },
        })),
      deleteScheduleBlock: (userId, blockId) =>
        set((state) => ({
          schedules: {
            ...state.schedules,
            [userId]: (state.schedules[userId] || []).filter((block) => block.id !== blockId),
          },
        })),
      setSchedule: (userId, blocks) =>
        set((state) => ({
          schedules: {
            ...state.schedules,
            [userId]: blocks,
          },
        })),
    }),
    {
      name: 'momentum-schedule-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
