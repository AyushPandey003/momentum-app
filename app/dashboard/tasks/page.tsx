"use client"

import { TaskList } from "@/components/task-list"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function TasksPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "calendar_connected") {
      toast({
        title: "Calendar Connected",
        description: "Your Google Calendar has been successfully connected. You can now schedule tasks to your calendar.",
      })
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_code: "Authorization code was missing",
        token_error: "Failed to get authentication tokens",
        callback_failed: "Calendar connection failed",
        unauthorized: "Please log in to connect your calendar",
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessages[error] || "Failed to connect calendar. Please try again.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const handleConnectCalendar = () => {
    window.location.href = "/api/connect-calendar"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage all your tasks in one place</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleConnectCalendar}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Connect Calendar
          </Button>
          <AddTaskDialog  />
        </div>
      </div>

      <TaskList />
    </div>
  )
}
