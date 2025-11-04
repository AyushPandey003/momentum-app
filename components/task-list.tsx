"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Task, User } from "@/lib/types"
import { getCurrentUser, updateUser } from "@/lib/auth-utils"
import { authClient } from "@/lib/auth-client"
import { Clock, Calendar, Trash2, MoreVertical, ChevronDown, ChevronRight, CheckCircle2, UserCheck, ClockIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AIDecomposeDialog } from "./ai-decompose-dialog"
import { AddTaskDialog } from "./add-task-dialog"
import { TaskCompletionDialog } from "./task-completion-dialog"
import { useToast } from "@/hooks/use-toast"

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
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [completionTask, setCompletionTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const { data: session } = authClient.useSession()

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)
    fetchTasks()
  }, [session])

  const fetchTasks = async () => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/tasks")
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks. Please refresh.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshTasks = () => {
    fetchTasks()
  }

  const handleToggleComplete = async (task: Task) => {
    if (task.status === "completed") {
      // Unmark as completed
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...task,
            status: "todo",
            completedAt: null,
          }),
        })
        if (res.ok) {
          refreshTasks()
        }
      } catch (error) {
        console.error("Failed to update task:", error)
      }
      return
    }

    // If task has manager, require verification image
    if (task.managerEmail && task.managerStatus === "accepted") {
      setCompletionTask(task)
      return
    }

    // No manager or manager not accepted yet - can complete directly
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          status: "completed",
          completedAt: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        refreshTasks()
        const currentUser = getCurrentUser()
        if (currentUser) {
          updateUser({
            stats: {
              ...currentUser.stats,
              tasksCompleted: currentUser.stats.tasksCompleted + 1,
              totalPoints: currentUser.stats.totalPoints + 10,
            },
          })
        }
      }
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const handleCompleteWithImage = async (taskId: string, imageUrl: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          status: "completed",
          completedAt: new Date().toISOString(),
          verificationImageUrl: imageUrl,
        }),
      })
      if (res.ok) {
        refreshTasks()
        const currentUser = getCurrentUser()
        if (currentUser) {
          updateUser({
            stats: {
              ...currentUser.stats,
              tasksCompleted: currentUser.stats.tasksCompleted + 1,
              totalPoints: currentUser.stats.totalPoints + 10,
            },
          })
        }
      }
    } catch (error) {
      console.error("Failed to complete task:", error)
      throw error
    }
  }

  const handleToggleSubtask = async (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st))

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          subtasks: updatedSubtasks,
        }),
      })
      if (res.ok) {
        refreshTasks()
      }
    } catch (error) {
      console.error("Failed to update subtask:", error)
    }
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

  const getManagerStatusBadge = (task: Task) => {
    if (!task.managerEmail) return null
    if (task.managerStatus === "accepted") {
      if (task.status === "completed") {
        if (task.managerConfirmed) {
          return (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Confirmed
            </Badge>
          )
        } else {
          return (
            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              <ClockIcon className="w-3 h-3 mr-1" />
              Pending Review
            </Badge>
          )
        }
      }
      return (
        <Badge variant="outline" className="text-xs">
          <UserCheck className="w-3 h-3 mr-1" />
          Managed
        </Badge>
      )
    }
    if (task.managerStatus === "pending") {
      return (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Invite Pending
        </Badge>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Loading tasks...</p>
        </CardContent>
      </Card>
    )
  }

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
      {completionTask && (
        <TaskCompletionDialog
          task={completionTask}
          isOpen={!!completionTask}
          onClose={() => setCompletionTask(null)}
          onComplete={handleCompleteWithImage}
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

                    {getManagerStatusBadge(task)}

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
