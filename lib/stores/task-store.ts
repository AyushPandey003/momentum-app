import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Task } from '@/lib/types'

interface TaskState {
  tasks: Record<string, Task[]> // userId -> tasks[]
  getTasks: (userId: string) => Task[]
  addTask: (userId: string, task: Task) => void
  updateTask: (userId: string, taskId: string, updates: Partial<Task>) => void
  deleteTask: (userId: string, taskId: string) => void
  setTasks: (userId: string, tasks: Task[]) => void
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: {},
      getTasks: (userId) => get().tasks[userId] || [],
      addTask: (userId, task) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            [userId]: [...(state.tasks[userId] || []), task],
          },
        })),
      updateTask: (userId, taskId, updates) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            [userId]: (state.tasks[userId] || []).map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            ),
          },
        })),
      deleteTask: (userId, taskId) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            [userId]: (state.tasks[userId] || []).filter((task) => task.id !== taskId),
          },
        })),
      setTasks: (userId, tasks) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            [userId]: tasks,
          },
        })),
    }),
    {
      name: 'momentum-tasks-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
