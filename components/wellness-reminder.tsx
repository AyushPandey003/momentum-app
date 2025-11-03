"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"
import { getRandomWellnessTip, shouldShowWellnessReminder } from "@/lib/wellness"
import type { WellnessTip } from "@/lib/wellness"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/lib/auth-utils"

export function WellnessReminder() {
  const [currentTip, setCurrentTip] = useState<WellnessTip | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)
  }, [])

  useEffect(() => {
    if (!user?.preferences?.wellnessReminders) return

    const checkReminder = () => {
      const lastReminder = localStorage.getItem("lastWellnessReminder")
      const intervalMinutes = user.preferences.wellnessReminderInterval || 30

      if (shouldShowWellnessReminder(lastReminder, intervalMinutes)) {
        const tip = getRandomWellnessTip()
        setCurrentTip(tip)
        setIsVisible(true)
        localStorage.setItem("lastWellnessReminder", new Date().toISOString())
      }
    }

    // Check immediately
    checkReminder()

    // Check every minute
    const interval = setInterval(checkReminder, 60000)

    return () => clearInterval(interval)
  }, [user])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => setCurrentTip(null), 300)
  }

  const handleComplete = () => {
    // Could track wellness actions here
    handleDismiss()
  }

  if (!currentTip) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300 transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      )}
    >
      <Card className="w-80 border-green-500/50 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{currentTip.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1">{currentTip.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{currentTip.description}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleComplete} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Done
                </Button>
                <Button size="sm" variant="outline" onClick={handleDismiss}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
