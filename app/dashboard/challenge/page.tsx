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
          <div className="space-y-6 w-full max-w-5xl mx-auto">
            <div className="rounded-xl border bg-card/60 p-5 sm:p-6">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Daily Practice Arena</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">Challenge Yourself</h1>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-3xl">
                Switch between quiz and LeetCode challenges, track your accuracy, and keep building momentum with every solved problem.
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
