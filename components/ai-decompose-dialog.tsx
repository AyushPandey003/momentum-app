"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sparkles, Loader2, Check } from "lucide-react"
import type { Task, Subtask } from "@/lib/types"
import { decomposeTask } from "@/lib/ai"
import { saveTask } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

interface AIDecomposeDialogProps {
  task: Task
  onSuccess?: () => void
}

export function AIDecomposeDialog({ task, onSuccess }: AIDecomposeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [hasDecomposed, setHasDecomposed] = useState(false)
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleDecompose = async () => {
    setIsLoading(true)
    try {
      const generatedSubtasks = await decomposeTask(task)
      setSubtasks(generatedSubtasks)
      setHasDecomposed(true)
    } catch (error) {
      console.error("Failed to decompose task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    if (!user) return

    const updatedTask: Task = {
      ...task,
      subtasks,
      aiDecomposed: true,
    }

    saveTask(user.id, updatedTask)
    setOpen(false)
    onSuccess?.()
  }

  const updateSubtask = (index: number, updates: Partial<Subtask>) => {
    const updated = [...subtasks]
    updated[index] = { ...updated[index], ...updates }
    setSubtasks(updated)
  }

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Decompose
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Task Decomposition</DialogTitle>
          <DialogDescription>Let AI break down "{task.title}" into manageable subtasks</DialogDescription>
        </DialogHeader>

        {!hasDecomposed ? (
          <div className="space-y-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">How AI Decomposition Works</h3>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes your task and breaks it down into smaller, actionable steps. Each subtask gets an
                      estimated time allocation to help you plan better.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h4 className="font-medium">Task Details</h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Title:</span> {task.title}
                </p>
                <p>
                  <span className="text-muted-foreground">Estimated Time:</span> {task.estimatedTime} minutes
                </p>
                <p>
                  <span className="text-muted-foreground">Priority:</span> {task.priority}
                </p>
              </div>
            </div>

            <Button onClick={handleDecompose} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing task...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Decompose with AI
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              AI has generated {subtasks.length} subtasks
            </div>

            <div className="space-y-3">
              {subtasks.map((subtask, index) => (
                <Card key={subtask.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={(checked) => updateSubtask(index, { completed: checked as boolean })}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <Input
                          value={subtask.title}
                          onChange={(e) => updateSubtask(index, { title: e.target.value })}
                          className="font-medium"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Time:</span>
                          <Input
                            type="number"
                            value={subtask.estimatedTime}
                            onChange={(e) =>
                              updateSubtask(index, { estimatedTime: Number.parseInt(e.target.value) || 0 })
                            }
                            className="w-20 h-7 text-xs"
                            min="5"
                            step="5"
                          />
                          <span className="text-xs text-muted-foreground">min</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubtask(index)}
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Check className="w-4 h-4 mr-2" />
                Save Subtasks
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
