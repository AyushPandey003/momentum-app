import { PomodoroTimer } from "@/components/pomodoro-timer"
import { DailySchedule } from "@/components/daily-schedule"
import { TaskList } from "@/components/task-list"

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">Schedule & Focus</h1>
          <p className="text-sm text-muted-foreground">Master your time with Pomodoro and intelligent scheduling</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-in fade-in slide-in-from-left-2 duration-500 delay-100 fill-mode-both">
          <PomodoroTimer />
        </div>
        <div className="animate-in fade-in slide-in-from-right-2 duration-500 delay-100 fill-mode-both">
          <DailySchedule />
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Your Tasks</h2>
          <TaskList />
        </div>
      </div>
    </div>
  )
}
