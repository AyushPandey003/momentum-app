"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import type { Task, ScheduleBlock, GoogleCalendarEvent } from "@/lib/types"
import { getTasks, getSchedule } from "@/lib/data"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([])
  const { data: session } = authClient.useSession()

  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);

  useEffect(() => {
    if (session?.user) {
      setTasks(getTasks(session.user.id));
      setSchedule(getSchedule(session.user.id));

      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const fetchEvents = async () => {
        try {
          const response = await fetch(
            `/api/calendar/events?timeMin=${firstDay.toISOString()}&timeMax=${lastDay.toISOString()}`
          );
          if (response.ok) {
            const events = await response.json();
            setCalendarEvents(events);
          } else {
            console.error("Error fetching calendar events:", await response.json());
          }
        } catch (error) {
          console.error("Error fetching calendar events:", error);
        }
      };

      fetchEvents();
    }
  }, [session, currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getEventsForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return calendarEvents.filter((event) => {
      const eventStartDate = new Date(event.start?.dateTime || event.start?.date || '');
      return (
        eventStartDate.getFullYear() === date.getFullYear() &&
        eventStartDate.getMonth() === date.getMonth() &&
        eventStartDate.getDate() === date.getDate()
      );
    });
  };

  // Helper to get tasks for a specific day of the current month
  const getTasksForDate = (day: number) => {
    // Tasks have a dueDate string; create a Date and compare year/month/day
    return tasks.filter((task) => {
      try {
        const d = new Date(task.dueDate)
        return (
          d.getFullYear() === currentDate.getFullYear() &&
          d.getMonth() === currentDate.getMonth() &&
          d.getDate() === day
        )
      } catch (e) {
        return false
      }
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayTasks = getTasksForDate(day)
            const today = isToday(day)

            const dayEvents = getEventsForDate(day);
            const dayItems = [
              ...dayTasks.map(t => ({ ...t, itemType: 'task' as const })),
              ...dayEvents.map(e => ({ 
                id: e.id, 
                title: e.summary || 'Untitled Event',
                itemType: 'event' as const,
                start: e.start,
                end: e.end,
                location: e.location
              }))
            ];

            return (
              <div
                key={day}
                className={cn(
                  "aspect-square p-2 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer",
                  today && "bg-primary/10 border-primary",
                )}
              >
                <div className={cn("text-sm font-medium mb-1", today && "text-primary")}>{day}</div>
                <div className="space-y-1">
                  {dayItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "text-xs truncate px-1 py-0.5 rounded flex items-center gap-1",
                        item.itemType === "task" 
                          ? "bg-primary/20 text-primary" 
                          : "bg-green-500/20 text-green-600"
                      )}
                      title={item.title}
                    >
                      {item.itemType === "event" && (
                        <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <div className="text-xs text-muted-foreground px-1">+{dayItems.length - 2} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
