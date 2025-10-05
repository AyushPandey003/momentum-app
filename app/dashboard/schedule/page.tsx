import { PomodoroTimer } from "@/components/pomodoro-timer"
import { DailySchedule } from "@/components/daily-schedule"
import { TaskList } from "@/components/task-list"

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule & Focus</h1>
        <p className="text-muted-foreground">Manage your time with Pomodoro technique and smart scheduling</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PomodoroTimer />
        <DailySchedule />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
        <TaskList />
      </div>
    </div>
  )
}
