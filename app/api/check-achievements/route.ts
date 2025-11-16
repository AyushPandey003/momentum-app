import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST endpoint to check for newly unlocked achievements
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user achievements from database
    const achievements = await db
      .select({
        achievementId: schema.userAchievements.achievementId,
        unlockedAt: schema.userAchievements.unlockedAt,
      })
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, session.user.id))
      .orderBy(schema.userAchievements.unlockedAt);

    // Get user stats
    const userStats = await db.query.userStats.findFirst({
      where: eq(schema.userStats.userId, session.user.id)
    });

    // Get contest results
    const contestResults = await db
      .select({
        rank: schema.contestResult.rank,
        score: schema.contestResult.score,
      })
      .from(schema.contestResult)
      .where(eq(schema.contestResult.userId, session.user.id));

    const winsCount = contestResults.filter(r => r.rank === 1).length;
    const contestPoints = contestResults.reduce((sum, r) => sum + (r.score || 0), 0);
    const totalPoints = userStats?.totalPoints || contestPoints;

    // Check for newly unlocked achievements
    const unlockedAchievementIds = achievements.map(a => a.achievementId);
    const newAchievements = [];

    // Define achievement criteria
    const achievementChecks = [
      {
        id: "contest_points_10k",
        title: "Contest Master",
        description: "Earn 10,000+ contest points",
        icon: "🏆",
        points: 500,
        condition: totalPoints >= 10000,
      },
      {
        id: "contest_points_20k_2wins",
        title: "Elite Competitor",
        description: "Earn 20,000+ points and win 2+ contests",
        icon: "👑",
        points: 1000,
        condition: totalPoints >= 20000 && winsCount >= 2,
      },
      {
        id: "contest_wins_5",
        title: "Champion",
        description: "Win 5+ contests",
        icon: "⭐",
        points: 1500,
        condition: winsCount >= 5,
      },
    ];

    for (const achievement of achievementChecks) {
      if (achievement.condition && !unlockedAchievementIds.includes(achievement.id)) {
        newAchievements.push({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          points: achievement.points,
        });
      }
    }

    return NextResponse.json({
      newAchievements,
      stats: {
        totalPoints,
        winsCount,
      }
    });
  } catch (error) {
    console.error("Error checking achievements:", error);
    return NextResponse.json(
      { error: "Failed to check achievements" },
      { status: 500 }
    );
  }
}
