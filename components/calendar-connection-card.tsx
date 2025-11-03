"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { authClient } from "@/lib/auth-client"

interface CalendarStatus {
  connected: boolean
  expired?: boolean
  scope?: string
  message: string
}

export function CalendarConnectionCard() {
  const { data: session } = authClient.useSession()
  const [status, setStatus] = useState<CalendarStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    if (!session?.user) return

    setLoading(true)
    try {
      const response = await fetch("/api/calendar/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else {
        setStatus({
          connected: false,
          message: "Failed to check calendar status",
        })
      }
    } catch (error) {
      console.error("Error checking calendar status:", error)
      setStatus({
        connected: false,
        message: "Error checking calendar status",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [session])

  const handleConnect = () => {
    window.location.href = "/api/connect-calendar"
  }

  if (!session?.user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to automatically schedule tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking connection status...</span>
          </div>
        ) : status?.connected && !status.expired ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{status.message}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your tasks will be automatically scheduled to Google Calendar when you enable
              "Schedule to Calendar" during task creation.
            </p>
            <Button variant="outline" onClick={handleConnect}>
              Reconnect Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">
                {status?.expired ? "Calendar token expired" : "Calendar not connected"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to enable automatic task scheduling. This allows
              Momentum to create calendar events with AI-optimized time slots.
            </p>
            <Button onClick={handleConnect} className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
