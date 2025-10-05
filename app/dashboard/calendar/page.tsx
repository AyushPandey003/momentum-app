import { CalendarView } from "@/components/calendar-view"
import { AddTaskDialog } from "@/components/add-task-dialog"

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">View your tasks and schedule</p>
        </div>
        <AddTaskDialog />
      </div>

      <CalendarView />
    </div>
  )
}
