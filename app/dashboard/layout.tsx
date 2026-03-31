"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getCurrentUser, updateUser } from "@/lib/auth-utils"
import { checkAchievements } from "@/lib/gamification"
import { AchievementNotification } from "@/components/achievement-notification"
import { WellnessReminder } from "@/components/wellness-reminder"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import type { Achievement } from "@/lib/types"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [user, setUser] = useState<any | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // Restore sidebar state from localStorage
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setSidebarOpen(!JSON.parse(saved))
    }
  }, [])

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen
    setSidebarOpen(newState)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(!newState))
  }

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)

    if (u) {
      const unlocked = checkAchievements(u)
      if (unlocked.length > 0) {
        setNewAchievements(unlocked)

        // Update user achievements
        const newAchievementIds = unlocked.map((a) => a.id)
        const totalPoints = unlocked.reduce((sum, a) => sum + a.points, 0)

        updateUser({
          achievements: [...(u.achievements || []), ...newAchievementIds],
          stats: {
            ...u.stats,
            totalPoints: (u.stats?.totalPoints || 0) + totalPoints,
          },
        })
      }
    }
  }, [])

  const handleCloseNotification = (index: number) => {
    setNewAchievements((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <DashboardNav isCollapsed={!sidebarOpen} onToggle={handleToggleSidebar} />

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        {/* Header with toggle button */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border/30 px-4 py-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            className="hover:bg-accent"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="w-9" />
        </div>

        <div className="max-w-[1920px] mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Achievement notifications */}
      {newAchievements.map((achievement, index) => (
        <AchievementNotification
          key={achievement.id}
          achievement={achievement}
          onClose={() => handleCloseNotification(index)}
        />
      ))}

      {/* Wellness reminders */}
      <WellnessReminder />
    </div>
  )
}
