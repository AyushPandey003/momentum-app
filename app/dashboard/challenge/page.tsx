"use client"

import type React from "react"

import { DashboardNav } from "@/components/dashboard-nav"
import { WellnessReminder } from "@/components/wellness-reminder"
import { ChallengeYourself } from "@/components/challenge-yourself"

export default function ChallengePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="">
        <div className="container max-w-[1920px] py-8 px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="space-y-6 w-full max-w-4xl mx-auto">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">Challenge Yourself</h1>
              <p className="text-muted-foreground mb-6 text-base sm:text-lg">
                Test your knowledge across various categories and earn points to level up!
              </p>
            </div>

            <ChallengeYourself />
          </div>
        </div>
      </main>
      <WellnessReminder />
    </div>
  )
}
