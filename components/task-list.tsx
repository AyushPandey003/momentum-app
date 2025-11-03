"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Task, User } from "@/lib/types"
import { getTasks, saveTask, deleteTask } from "@/lib/data"
import { getCurrentUser, updateUser } from "@/lib/auth-utils"
import { Clock, Calendar, Trash2, MoreVertical, ChevronDown, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AIDecomposeDialog } from "./ai-decompose-dialog"
import { AddTaskDialog } from "./add-task-dialog"

const priorityColors = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)
    if (u) {
      setTasks(getTasks(u.id))
    }
  }, [])

  const refreshTasks = () => {
    if (user) {
      setTasks(getTasks(user.id))
    }
  }

  const handleToggleComplete = (task: Task) => {
    if (!user) return

    const updatedTask: Task = {
      ...task,
      status: task.status === "completed" ? "todo" : "completed",
      completedAt: task.status === "completed" ? undefined : new Date().toISOString(),
    }

    saveTask(user.id, updatedTask)
    setTasks(getTasks(user.id))

    // Update user stats if completing
    if (updatedTask.status === "completed") {
      updateUser({
        stats: {
          ...user.stats,
          tasksCompleted: user.stats.tasksCompleted + 1,
          totalPoints: user.stats.totalPoints + 10,
        },
      })
    }
  }

  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    if (!user) return

    const updatedSubtasks = task.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st))

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
    }

    saveTask(user.id, updatedTask)
    setTasks(getTasks(user.id))
  }

  const handleDelete = async (taskId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        refreshTasks();
      } else {
        console.error("Error deleting task:", await response.json());
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1
    if (a.status !== "completed" && b.status === "completed") return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No tasks yet. Create your first task to get started!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {editingTask && (
        <AddTaskDialog
          isOpen={!!editingTask}
          setIsOpen={() => setEditingTask(null)}
          task={editingTask}
          onSuccess={refreshTasks}
        />
      )}
      {sortedTasks.map((task) => {
        const isExpanded = expandedTasks.has(task.id)
        const hasSubtasks = task.subtasks.length > 0
        const completedSubtasks = task.subtasks.filter((st) => st.completed).length

        return (
          <Card key={task.id} className={cn(task.status === "completed" && "opacity-60")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => handleToggleComplete(task)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      {hasSubtasks && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpanded(task.id)}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
                      <h3
                        className={cn(
                          "font-medium",
                          task.status === "completed" && "line-through text-muted-foreground",
                        )}
                      >
                        {task.title}
                      </h3>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTask(task)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {task.estimatedTime} min
                    </div>

                    {hasSubtasks && (
                      <Badge variant="outline" className="text-xs">
                        {completedSubtasks}/{task.subtasks.length} subtasks
                      </Badge>
                    )}

                    {!hasSubtasks && task.status !== "completed" && (
                      <AIDecomposeDialog task={task} onSuccess={refreshTasks} />
                    )}
                  </div>

                  {hasSubtasks && isExpanded && (
                    <div className="mt-4 ml-6 space-y-2 border-l-2 border-border pl-4">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3">
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() => handleToggleSubtask(task, subtask.id)}
                          />
                          <span
                            className={cn("text-sm flex-1", subtask.completed && "line-through text-muted-foreground")}
                          >
                            {subtask.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{subtask.estimatedTime} min</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
