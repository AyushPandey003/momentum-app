"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task } from "@/lib/types"
import { saveTask } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"

interface TaskFormProps {
  task?: Task
  onSuccess?: () => void
  onCancel?: () => void
}

export function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const newTask: Task = {
      id: task?.id || crypto.randomUUID(),
      userId: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") as string,
      priority: formData.get("priority") as Task["priority"],
      status: task?.status || "todo",
      estimatedTime: Number.parseInt(formData.get("estimatedTime") as string) || 60,
      actualTime: task?.actualTime || 0,
      tags: [],
      subtasks: task?.subtasks || [],
      source: "manual",
      createdAt: task?.createdAt || new Date().toISOString(),
      aiDecomposed: false,
    }

    saveTask(user.id, newTask)
    setIsLoading(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input id="title" name="title" defaultValue={task?.title} placeholder="Complete assignment..." required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={task?.description}
          placeholder="Add details about this task..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="datetime-local"
            defaultValue={task?.dueDate?.slice(0, 16)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedTime">Estimated Time (min)</Label>
          <Input
            id="estimatedTime"
            name="estimatedTime"
            type="number"
            defaultValue={task?.estimatedTime || 60}
            min="15"
            step="15"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select name="priority" defaultValue={task?.priority || "medium"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : task ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  )
}
