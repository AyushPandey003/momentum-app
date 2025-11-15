import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET user achievements
export async function GET(req: NextRequest) {
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

    // Get user stats for checking contest achievements
    const userStats = await db.query.userStats.findFirst({
      where: eq(schema.userStats.userId, session.user.id)
    });

    // Get contest results to count wins and total contest points
    const contestResults = await db
      .select({
        rank: schema.contestResult.rank,
        score: schema.contestResult.score,
      })
      .from(schema.contestResult)
      .where(eq(schema.contestResult.userId, session.user.id));

    const winsCount = contestResults.filter(r => r.rank === 1).length;
    // Total contest points from all contest results
    const contestPoints = contestResults.reduce((sum, r) => sum + (r.score || 0), 0);
    // userStats.totalPoints should already include contest points (updated by Go backend)
    // But we use contestPoints as fallback if stats not updated yet
    const totalPoints = userStats?.totalPoints || contestPoints;

    // Check which achievements are unlocked
    const unlockedAchievementIds = achievements.map(a => a.achievementId);
    
    // Get all user stats for other achievements
    const tasksCompleted = userStats?.tasksCompleted || 0;
    const pomodorosCompleted = userStats?.pomodorosCompleted || 0;
    const currentStreak = userStats?.currentStreak || 0;
    const totalFocusTime = userStats?.totalFocusTime || 0;
    
    // Define all contest achievements with progress
    const contestAchievements = [
      {
        id: "contest_points_10k",
        title: "Contest Master",
        description: "Earn 10,000+ contest points",
        icon: "🏆",
        points: 500,
        unlocked: unlockedAchievementIds.includes("contest_points_10k"),
        progress: totalPoints,
        total: 10000,
      },
      {
        id: "contest_points_20k_2wins",
        title: "Elite Competitor",
        description: "Earn 20,000+ points and win 2+ contests",
        icon: "👑",
        points: 1000,
        unlocked: unlockedAchievementIds.includes("contest_points_20k_2wins"),
        progress: { points: totalPoints, wins: winsCount },
        total: { points: 20000, wins: 2 },
      },
      {
        id: "contest_wins_5",
        title: "Champion",
        description: "Win 5+ contests",
        icon: "⭐",
        points: 1500,
        unlocked: unlockedAchievementIds.includes("contest_wins_5"),
        progress: winsCount,
        total: 5,
      },
    ];

    // Return all achievements (contest + others from database)
    // Frontend will merge with ACHIEVEMENTS array
    const unlocked = contestAchievements.filter(a => a.unlocked);
    const locked = contestAchievements.filter(a => !a.unlocked);

    return NextResponse.json({
      unlocked,
      locked,
      stats: {
        totalPoints,
        winsCount,
      }
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}

