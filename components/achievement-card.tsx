import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Achievement } from "@/lib/types"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AchievementCardProps {
  achievement: Achievement
  unlocked: boolean
}

export function AchievementCard({ achievement, unlocked }: AchievementCardProps) {
  return (
    <Card className={cn(!unlocked && "opacity-50")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-4xl">
            {unlocked ? achievement.icon : <Lock className="w-10 h-10 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">{achievement.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
            <Badge variant="outline" className="text-xs">
              {achievement.points} points
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
