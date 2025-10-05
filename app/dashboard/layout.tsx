"use client"

import type React from "react"

import { DashboardNav } from "@/components/dashboard-nav"
import { useEffect, useState } from "react"
import { getCurrentUser, updateUser } from "@/lib/auth"
import { checkAchievements } from "@/lib/gamification"
import { AchievementNotification } from "@/components/achievement-notification"
import { WellnessReminder } from "@/components/wellness-reminder"
import type { Achievement } from "@/lib/types"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [user, setUser] = useState<any | null>(null)

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
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="lg:pl-64">
        <div className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8">{children}</div>
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
