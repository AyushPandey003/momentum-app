import { TaskList } from "@/components/task-list"
import { AddTaskDialog } from "@/components/add-task-dialog"

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage all your tasks in one place</p>
        </div>
        <AddTaskDialog />
      </div>

      <TaskList />
    </div>
  )
}
