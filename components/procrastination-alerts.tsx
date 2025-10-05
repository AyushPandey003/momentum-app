"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTasks } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import { detectProcrastination } from "@/lib/ai"

export function ProcrastinationAlerts() {
  const [alerts, setAlerts] = useState<string[]>([])
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)
    if (u) {
      const tasks = getTasks(u.id)
      const detectedAlerts = detectProcrastination(tasks)
      setAlerts(detectedAlerts)
    }
  }, [])

  const handleDismiss = (index: number) => {
    setDismissed(new Set([...dismissed, index]))
  }

  const visibleAlerts = alerts.filter((_, index) => !dismissed.has(index))

  if (visibleAlerts.length === 0) return null

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert, index) => (
        <Alert key={index} variant="destructive" className="relative">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="pr-8">{alert}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => handleDismiss(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  )
}
