"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Heart, Droplet, Eye, Activity } from "lucide-react"

export function WellnessDashboard() {
  // Mock wellness data - in production, this would track actual user actions
  const wellnessStats = {
    hydration: { current: 6, goal: 8, unit: "glasses" },
    breaks: { current: 4, goal: 6, unit: "breaks" },
    eyeRest: { current: 3, goal: 5, unit: "times" },
    movement: { current: 2, goal: 3, unit: "sessions" },
  }

  const getProgress = (current: number, goal: number) => (current / goal) * 100

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hydration</CardTitle>
          <Droplet className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {wellnessStats.hydration.current}/{wellnessStats.hydration.goal}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{wellnessStats.hydration.unit} today</p>
          <Progress
            value={getProgress(wellnessStats.hydration.current, wellnessStats.hydration.goal)}
            className="h-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Breaks Taken</CardTitle>
          <Heart className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {wellnessStats.breaks.current}/{wellnessStats.breaks.goal}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{wellnessStats.breaks.unit} today</p>
          <Progress value={getProgress(wellnessStats.breaks.current, wellnessStats.breaks.goal)} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eye Rest</CardTitle>
          <Eye className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {wellnessStats.eyeRest.current}/{wellnessStats.eyeRest.goal}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{wellnessStats.eyeRest.unit} today</p>
          <Progress value={getProgress(wellnessStats.eyeRest.current, wellnessStats.eyeRest.goal)} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Movement</CardTitle>
          <Activity className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {wellnessStats.movement.current}/{wellnessStats.movement.goal}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{wellnessStats.movement.unit} today</p>
          <Progress value={getProgress(wellnessStats.movement.current, wellnessStats.movement.goal)} className="h-2" />
        </CardContent>
      </Card>
    </div>
  )
}
