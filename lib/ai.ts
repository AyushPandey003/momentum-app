import type { Task, Subtask } from "./types"

// Mock AI task decomposition
// In production, this would call an actual AI API
export async function decomposeTask(task: Task): Promise<Subtask[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Generate intelligent subtasks based on task title and description
  const subtasks: Subtask[] = []

  // Analyze task complexity and generate appropriate subtasks
  const taskLower = `${task.title} ${task.description}`.toLowerCase()

  if (taskLower.includes("essay") || taskLower.includes("paper") || taskLower.includes("report")) {
    subtasks.push(
      {
        id: crypto.randomUUID(),
        title: "Research and gather sources",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.25),
      },
      {
        id: crypto.randomUUID(),
        title: "Create outline and structure",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.15),
      },
      {
        id: crypto.randomUUID(),
        title: "Write first draft",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.35),
      },
      {
        id: crypto.randomUUID(),
        title: "Review and edit",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.15),
      },
      {
        id: crypto.randomUUID(),
        title: "Final proofreading and formatting",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.1),
      },
    )
  } else if (taskLower.includes("project") || taskLower.includes("assignment")) {
    subtasks.push(
      {
        id: crypto.randomUUID(),
        title: "Review requirements and rubric",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.1),
      },
      {
        id: crypto.randomUUID(),
        title: "Break down into smaller components",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.15),
      },
      {
        id: crypto.randomUUID(),
        title: "Complete main work",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.5),
      },
      {
        id: crypto.randomUUID(),
        title: "Test and verify results",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.15),
      },
      {
        id: crypto.randomUUID(),
        title: "Prepare submission",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.1),
      },
    )
  } else if (taskLower.includes("study") || taskLower.includes("exam") || taskLower.includes("test")) {
    subtasks.push(
      {
        id: crypto.randomUUID(),
        title: "Review course materials and notes",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.3),
      },
      {
        id: crypto.randomUUID(),
        title: "Create study guide or flashcards",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.2),
      },
      {
        id: crypto.randomUUID(),
        title: "Practice problems or questions",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.3),
      },
      {
        id: crypto.randomUUID(),
        title: "Review difficult concepts",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.2),
      },
    )
  } else if (taskLower.includes("read") || taskLower.includes("chapter")) {
    subtasks.push(
      {
        id: crypto.randomUUID(),
        title: "Skim and preview content",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.15),
      },
      {
        id: crypto.randomUUID(),
        title: "Read and take notes",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.6),
      },
      {
        id: crypto.randomUUID(),
        title: "Summarize key points",
        completed: false,
        estimatedTime: Math.floor(task.estimatedTime * 0.25),
      },
    )
  } else {
    // Generic decomposition for other tasks
    const numSubtasks = Math.min(Math.max(3, Math.floor(task.estimatedTime / 30)), 6)
    const timePerSubtask = Math.floor(task.estimatedTime / numSubtasks)

    for (let i = 0; i < numSubtasks; i++) {
      subtasks.push({
        id: crypto.randomUUID(),
        title: `Step ${i + 1}: Work on ${task.title.toLowerCase()}`,
        completed: false,
        estimatedTime: timePerSubtask,
      })
    }
  }

  return subtasks
}

// Mock AI scheduling suggestions
export async function generateScheduleSuggestions(task: Task, userPreferences: any) {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const now = new Date()
  const dueDate = new Date(task.dueDate)
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Generate smart scheduling suggestions
  const suggestions = []

  if (daysUntilDue > 3) {
    suggestions.push({
      title: "Spread it out",
      description: "Work on this task in small chunks over multiple days",
      schedule: "Daily 30-minute sessions",
    })
  }

  if (task.priority === "urgent" || daysUntilDue <= 2) {
    suggestions.push({
      title: "Focus session",
      description: "Dedicate a focused block to complete this task",
      schedule: "Next available 2-hour block",
    })
  }

  suggestions.push({
    title: "Morning momentum",
    description: "Tackle this during your peak productivity hours",
    schedule: "Tomorrow 9:00 AM - 11:00 AM",
  })

  return suggestions
}

// Mock procrastination detection
export function detectProcrastination(tasks: Task[]): string[] {
  const alerts: string[] = []
  const now = new Date()

  tasks.forEach((task) => {
    if (task.status === "completed") return

    const dueDate = new Date(task.dueDate)
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilDue < 24 && hoursUntilDue > 0 && task.priority === "urgent") {
      alerts.push(`"${task.title}" is due in less than 24 hours! Time to focus.`)
    }

    if (hoursUntilDue < 0) {
      alerts.push(`"${task.title}" is overdue. Let's break it down and tackle it now.`)
    }
  })

  return alerts
}
