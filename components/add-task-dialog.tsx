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
import { Plus } from "lucide-react"
import { TaskForm } from "./task-form"

export function AddTaskDialog({
  isOpen: isOpenProp,
  setIsOpen: setIsOpenProp,
  task,
  onSuccess,
}: {
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
  task?: any
  onSuccess?: () => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Keep internal state in sync when parent controls open prop
  useEffect(() => {
    if (typeof isOpenProp === "boolean") {
      setInternalOpen(isOpenProp)
    }
  }, [isOpenProp])

  const open = typeof isOpenProp === "boolean" ? isOpenProp : internalOpen
  const setOpen = (v: boolean) => {
    if (setIsOpenProp) setIsOpenProp(v)
    else setInternalOpen(v)
  }

  const handleSuccess = () => {
    if (onSuccess) onSuccess()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Edit the details of your task."
              : "Add a new task and let Momentum's AI help you schedule it perfectly."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          task={task}
          onSuccess={() => {
            handleSuccess()
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
