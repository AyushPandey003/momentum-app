"use client"

import { useEffect, useState } from "react"
import type { Task } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ManagerDashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/manager/tasks")
        if (res.ok) {
          const data = await res.json()
          setTasks(data.tasks || [])
        }
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const confirmTask = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/confirm`, { method: "POST" })
    if (res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, managerConfirmed: true, managerConfirmedAt: new Date().toISOString() } : t)))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mentees' Tasks</h1>
        <p className="text-muted-foreground">Review progress, view proof, and confirm completion.</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No assigned mentee tasks yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tasks.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t.status}</Badge>
                  {t.managerConfirmed && <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Confirmed</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="flex items-center gap-3">
                  {t.verificationImageUrl ? (
                    <a className="text-sm underline text-primary" href={t.verificationImageUrl} target="_blank" rel="noreferrer">
                      View verification image
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">No verification image</span>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    disabled={t.managerConfirmed || !t.verificationImageUrl || t.status !== "completed"}
                    onClick={() => confirmTask(t.id)}
                  >
                    {t.managerConfirmed ? "Confirmed" : "Confirm Completion"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


