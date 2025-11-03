"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCurrentUser, updateUser } from "@/lib/auth-utils"
import { Check } from "lucide-react"
import type { UserPreferences } from "@/lib/types"
import { CalendarConnectionCard } from "@/components/calendar-connection-card"

export default function SettingsPage() {
  const [user, setUser] = useState<any | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    pomodoroLength: 25,
    breakLength: 5,
    longBreakLength: 15,
    pomodorosUntilLongBreak: 4,
    workHoursStart: "09:00",
    workHoursEnd: "17:00",
    wellnessReminders: true,
    wellnessReminderInterval: 30,
    notificationsEnabled: true,
    theme: "system",
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)
    if (u?.preferences) setPreferences(u.preferences)
  }, [])

  const handleSave = () => {
    updateUser({ preferences })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Customize your Momentum experience</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Calendar Connection */}
        <CalendarConnectionCard />

        {/* Pomodoro Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pomodoro Timer</CardTitle>
            <CardDescription>Configure your focus and break durations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pomodoro-length">Focus Duration (minutes)</Label>
              <Input
                id="pomodoro-length"
                type="number"
                min="1"
                max="60"
                value={preferences.pomodoroLength}
                onChange={(e) =>
                  setPreferences({ ...preferences, pomodoroLength: Number.parseInt(e.target.value) || 25 })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="break-length">Short Break (minutes)</Label>
              <Input
                id="break-length"
                type="number"
                min="1"
                max="30"
                value={preferences.breakLength}
                onChange={(e) => setPreferences({ ...preferences, breakLength: Number.parseInt(e.target.value) || 5 })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="long-break-length">Long Break (minutes)</Label>
              <Input
                id="long-break-length"
                type="number"
                min="1"
                max="60"
                value={preferences.longBreakLength}
                onChange={(e) =>
                  setPreferences({ ...preferences, longBreakLength: Number.parseInt(e.target.value) || 15 })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pomodoros-until-long">Pomodoros Until Long Break</Label>
              <Input
                id="pomodoros-until-long"
                type="number"
                min="1"
                max="10"
                value={preferences.pomodorosUntilLongBreak}
                onChange={(e) =>
                  setPreferences({ ...preferences, pomodorosUntilLongBreak: Number.parseInt(e.target.value) || 4 })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Work Hours</CardTitle>
            <CardDescription>Set your typical working hours for smart scheduling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="work-start">Start Time</Label>
              <Input
                id="work-start"
                type="time"
                value={preferences.workHoursStart}
                onChange={(e) => setPreferences({ ...preferences, workHoursStart: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="work-end">End Time</Label>
              <Input
                id="work-end"
                type="time"
                value={preferences.workHoursEnd}
                onChange={(e) => setPreferences({ ...preferences, workHoursEnd: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Wellness Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Wellness Reminders</CardTitle>
            <CardDescription>Stay healthy with periodic wellness tips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="wellness-enabled">Enable Wellness Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminders to take breaks and stay healthy</p>
              </div>
              <Switch
                id="wellness-enabled"
                checked={preferences.wellnessReminders}
                onCheckedChange={(checked) => setPreferences({ ...preferences, wellnessReminders: checked })}
              />
            </div>

            {preferences.wellnessReminders && (
              <div className="grid gap-2">
                <Label htmlFor="wellness-interval">Reminder Interval (minutes)</Label>
                <Select
                  value={preferences.wellnessReminderInterval?.toString()}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, wellnessReminderInterval: Number.parseInt(value) })
                  }
                >
                  <SelectTrigger id="wellness-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="45">Every 45 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser notifications for timers and reminders</p>
              </div>
              <Switch
                id="notifications-enabled"
                checked={preferences.notificationsEnabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, notificationsEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} size="lg" className="w-full">
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  )
}
