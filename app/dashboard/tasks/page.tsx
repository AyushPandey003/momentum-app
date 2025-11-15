"use client"

import { TaskList } from "@/components/task-list"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { authClient } from "@/lib/auth-client"
import type { GoogleCalendarEvent } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function TasksPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { data: session } = authClient.useSession()
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "calendar_connected") {
      toast({
        title: "Calendar Connected",
        description: "Your Google Calendar has been successfully connected. You can now schedule tasks to your calendar.",
      })
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_code: "Authorization code was missing",
        token_error: "Failed to get authentication tokens",
        callback_failed: "Calendar connection failed",
        unauthorized: "Please log in to connect your calendar",
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessages[error] || "Failed to connect calendar. Please try again.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  useEffect(() => {
    if (session?.user) {
      fetchCalendarEvents()
    }
  }, [session])

  const fetchCalendarEvents = async () => {
    try {
      setLoadingEvents(true)
      const now = new Date()
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      const response = await fetch(
        `/api/calendar/events?timeMin=${now.toISOString()}&timeMax=${oneMonthFromNow.toISOString()}`
      )
      
      if (response.ok) {
        const events = await response.json()
        setCalendarEvents(events)
      } else {
        console.error("Error fetching calendar events:", await response.json())
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleConnectCalendar = () => {
    window.location.href = "/api/connect-calendar"
  }

  const formatEventTime = (event: GoogleCalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date
    const end = event.end?.dateTime || event.end?.date
    
    if (!start) return "No time specified"
    
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null
    
    // If it's an all-day event
    if (event.start?.date) {
      return `All day - ${startDate.toLocaleDateString()}`
    }
    
    // Regular event with time
    const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const dateString = startDate.toLocaleDateString()
    const endTimeString = endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    return `${dateString} at ${timeString}${endTimeString ? ` - ${endTimeString}` : ''}`
  }

  const upcomingEvents = calendarEvents
    .filter(event => {
      const eventTime = new Date(event.start?.dateTime || event.start?.date || '')
      return eventTime > new Date()
    })
    .sort((a, b) => {
      const aTime = new Date(a.start?.dateTime || a.start?.date || '').getTime()
      const bTime = new Date(b.start?.dateTime || b.start?.date || '').getTime()
      return aTime - bTime
    })
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage all your tasks in one place</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleConnectCalendar}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Connect Calendar
          </Button>
          <AddTaskDialog  />
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Calendar Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-sm">
                      {event.summary || "Untitled Event"}
                    </h3>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex-shrink-0">
                      Calendar Event
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatEventTime(event)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loadingEvents && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Loading calendar events...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <TaskList />
    </div>
  )
}
