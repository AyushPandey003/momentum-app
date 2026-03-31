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
      <div className="surface-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back. Your flow plan is ready for today.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AddTaskDialog />
            <a href="/api/connect-calendar">
              <button className="rounded-full bg-secondary px-4 py-2 font-semibold text-secondary-foreground transition hover:brightness-105">
                Connect Calendar
              </button>
            </a>
          </div>
        </div>
      </div>

      <ProcrastinationAlerts />

      <StatsCards />

      <div className="surface-panel rounded-[2rem] p-6">
        <h2 className="mb-4 text-xl font-semibold">Wellness Today</h2>
        <WellnessDashboard />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Your Tasks</h2>
          <TaskList />
        </div>

        <div className="space-y-6">
          <div className="surface-panel rounded-[2rem] p-5">
            <h2 className="text-xl font-semibold mb-4">Focus Timer</h2>
            <PomodoroTimer />
          </div>
          <div className="surface-panel rounded-[2rem] p-5">
            <h2 className="text-xl font-semibold mb-4">Calendar</h2>
            <CalendarView />
          </div>
        </div>
      </div>
    </div>
  )
}
