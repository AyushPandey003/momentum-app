"use client"

import { SystemDesignSimulator } from "@/components/system-design-simulator"

export default function SystemDesignPage() {
  return (
    <div className="space-y-6">
      <div className="surface-panel rounded-[2rem] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Learning by Doing</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">System Design Simulator</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
          Build distributed systems visually by dragging components onto a canvas, connecting service dependencies,
          and stress-testing your architecture with live simulation.
        </p>
      </div>

      <SystemDesignSimulator />
    </div>
  )
}
