"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Task } from "@/lib/types"
import { saveTask } from "@/lib/data"
import { authClient } from "@/lib/auth-client"
import { Calendar, Clock, Sparkles, Zap, Brain, CalendarCheck, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TaskFormProps {
  task?: Task
  onSuccess?: () => void
  onCancel?: () => void
}

export function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [scheduleToCalendar, setScheduleToCalendar] = useState(false)
  const [aiDecompose, setAiDecompose] = useState(false)
  const [autoSchedule, setAutoSchedule] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  
  // Use better-auth session hook for real-time auth state
  const { data: session } = authClient.useSession()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("🚀 Task form submitted!")
    
    if (!session?.user) {
      console.error("❌ No user found! Session:", session)
      toast({
        title: "Authentication Required",
        description: "Please log in to create tasks.",
        variant: "destructive",
      })
      return
    }

    console.log("✅ User authenticated:", session.user.id)
    setIsLoading(true)
    setIsCreating(true)

    const formData = new FormData(e.currentTarget)
    const newTask: Task = {
      id: task?.id || crypto.randomUUID(),
      userId: session.user.id,
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
      aiDecomposed: aiDecompose,
    }
    
    console.log("📝 Task data prepared:", newTask)

    try {
      if (task) {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTask),
        });

        if (response.ok) {
          toast({
            title: "Task Updated! 🎉",
            description: "Your task has been successfully updated.",
          })
          onSuccess?.();
        } else {
          throw new Error("Failed to update task")
        }
      } else {
        // Save task to database via API
        console.log("💾 Attempting to save task to database...")
        const createResponse = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTask),
        });

        console.log("📡 API Response status:", createResponse.status)

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          console.error("❌ API Error:", errorData);
          throw new Error(errorData.error || "Failed to create task");
        }

        const createData = await createResponse.json();
        const createdTask = createData.task;
        console.log("✅ Task created in database:", createdTask)

        // Also save to localStorage for immediate access
        saveTask(session.user.id, createdTask);
        console.log("💾 Task saved to localStorage")

        // Show success animation
        toast({
          title: "Task Created! 🎯",
          description: scheduleToCalendar 
            ? "Task saved! Now scheduling to your calendar..." 
            : "Your task has been successfully created.",
        })

        // Handle AI decomposition first (before calendar scheduling)
        if (aiDecompose) {
          setTimeout(async () => {
            toast({
              title: "AI Analyzing Task... 🧠",
              description: "Breaking down your task into manageable subtasks",
            })
            
            try {
              const decomposeResponse = await fetch("/api/tasks/decompose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  taskId: createdTask.id,
                  title: createdTask.title,
                  description: createdTask.description,
                  estimatedTime: createdTask.estimatedTime,
                }),
              });

              if (decomposeResponse.ok) {
                const data = await decomposeResponse.json();
                // Update local storage with subtasks
                const updatedTask = { ...createdTask, subtasks: data.subtasks, aiDecomposed: true };
                saveTask(session.user.id, updatedTask);
                
                toast({
                  title: "Subtasks Created! 🎯",
                  description: `Created ${data.subtasks.length} actionable steps`,
                })
              }
            } catch (error) {
              console.error("Decomposition error:", error);
              toast({
                title: "Note",
                description: "Task created but AI decomposition unavailable. Check backend connection.",
                variant: "default",
              })
            }
          }, 1000)
        }

        // Handle calendar scheduling
        if (scheduleToCalendar) {
          setTimeout(async () => {
            toast({
              title: "Finding Optimal Time... 📅",
              description: "AI is analyzing your calendar for the best focus period",
            })
            
            try {
              const scheduleResponse = await fetch("/api/tasks/schedule-to-calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  taskId: createdTask.id,
                  title: createdTask.title,
                  description: createdTask.description,
                  dueDate: createdTask.dueDate,
                  estimatedTime: createdTask.estimatedTime,
                  priority: createdTask.priority,
                }),
              });

              if (scheduleResponse.ok) {
                const scheduleData = await scheduleResponse.json();
                console.log("📅 Schedule response:", scheduleData);
                
                if (scheduleData.calendarConnected && scheduleData.event) {
                  toast({
                    title: "Calendar Event Created! ✨",
                    description: `Added to Google Calendar at ${new Date(scheduleData.schedule.startTime).toLocaleTimeString()}`,
                  });
                } else if (scheduleData.calendarError) {
                  toast({
                    title: "Task Scheduled (Calendar Not Connected)",
                    description: scheduleData.calendarError,
                    variant: "default",
                  });
                } else {
                  toast({
                    title: "Task Scheduled! 📅",
                    description: "Connect Google Calendar in Settings to sync automatically.",
                  });
                }
              } else {
                throw new Error("Scheduling failed");
              }
            } catch (error) {
              console.error("Calendar scheduling error:", error);
              toast({
                title: "Scheduling Note",
                description: "Task saved but calendar scheduling unavailable. Check backend connection.",
                variant: "default",
              })
            }
          }, aiDecompose ? 2500 : 800)
        }

        onSuccess?.();
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsCreating(false), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
  <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-3 pb-28">
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
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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

        {!task && (
          <>
            <Separator className="my-4" />
            
            {/* AI & Calendar Features */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Smart Scheduling Features
                </CardTitle>
                <CardDescription className="text-xs">
                  Let Momentum's AI help you stay organized
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Calendar Scheduling */}
                <div className="flex items-start justify-between space-x-3 rounded-lg border p-3 bg-background/50">
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                      <Label htmlFor="schedule-calendar" className="text-sm font-semibold cursor-pointer">
                        Schedule to Calendar
                      </Label>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Zap className="h-2.5 w-2.5 mr-0.5" />
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Find optimal time slots based on your energy
                    </p>
                  </div>
                  <Switch
                    id="schedule-calendar"
                    checked={scheduleToCalendar}
                    onCheckedChange={setScheduleToCalendar}
                  />
                </div>

                {/* AI Decomposition */}
                <div className="flex items-start justify-between space-x-3 rounded-lg border p-3 bg-background/50">
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      <Label htmlFor="ai-decompose" className="text-sm font-semibold cursor-pointer">
                        AI Task Breakdown
                      </Label>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                        New
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Break down into manageable subtasks
                    </p>
                  </div>
                  <Switch
                    id="ai-decompose"
                    checked={aiDecompose}
                    onCheckedChange={setAiDecompose}
                  />
                </div>

                {/* Auto Schedule Pomodoros */}
                <div className="flex items-start justify-between space-x-3 rounded-lg border p-3 bg-background/50">
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <Label htmlFor="auto-schedule" className="text-sm font-semibold cursor-pointer">
                        Pomodoro Time Blocks
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Schedule 25-min focused work sessions
                    </p>
                  </div>
                  <Switch
                    id="auto-schedule"
                    checked={autoSchedule}
                    onCheckedChange={setAutoSchedule}
                    disabled={!scheduleToCalendar}
                  />
                </div>

                {scheduleToCalendar && (
                  <div className="rounded-lg bg-primary/10 p-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-primary">Smart Scheduling Active</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5 leading-tight">
                          Momentum will find the best time for this task
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      
  {/* Footer buttons (sticky but not overlapping) */}
  <div className="flex gap-2 justify-end pt-3 border-t bg-background/95 sticky bottom-0 z-20 backdrop-blur-sm">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="min-w-[140px]">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isCreating ? "Creating..." : "Saving..."}
            </>
          ) : (
            <>
              {task ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Task
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Task
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
