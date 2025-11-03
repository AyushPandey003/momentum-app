import { StatsCards } from "@/components/stats-cards"
import { TaskList } from "@/components/task-list"
import { CalendarView } from "@/components/calendar-view"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { ProcrastinationAlerts } from "@/components/procrastination-alerts"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { WellnessDashboard } from "@/components/wellness-dashboard"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>
        <div className="flex items-center gap-4">
          <AddTaskDialog />
          <a href="/api/connect-calendar">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
              Connect Calendar
            </button>
          </a>
        </div>
      </div>

      <ProcrastinationAlerts />

      <StatsCards />

      <div>
        <h2 className="text-xl font-semibold mb-4">Wellness Today</h2>
        <WellnessDashboard />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Your Tasks</h2>
          <TaskList />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Focus Timer</h2>
            <PomodoroTimer />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Calendar</h2>
            <CalendarView />
          </div>
        </div>
      </div>
    </div>
  )
}
