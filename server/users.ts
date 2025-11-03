"use server";

import { db } from "@/db/drizzle";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, sql, sum } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Get top users for leaderboard based on actual user data
export const getGlobalLeaderboard = async (limit: number = 50) => {
    try {
        // Get all users with their stats and contest scores
        const usersWithStats = await db
            .select({
                id: schema.user.id,
                name: schema.user.name,
                email: schema.user.email,
                image: schema.user.image,
                createdAt: schema.user.createdAt,
                // User stats
                totalPoints: schema.userStats.totalPoints,
                level: schema.userStats.level,
                currentStreak: schema.userStats.currentStreak,
                longestStreak: schema.userStats.longestStreak,
                tasksCompleted: schema.userStats.tasksCompleted,
                pomodorosCompleted: schema.userStats.pomodorosCompleted,
                totalFocusTime: schema.userStats.totalFocusTime,
            })
            .from(schema.user)
            .leftJoin(schema.userStats, eq(schema.user.id, schema.userStats.userId))
            .orderBy(desc(schema.userStats.totalPoints))
            .limit(limit);

        // Get contest scores for each user
        const contestScores = await db
            .select({
                userId: schema.contestResult.userId,
                totalScore: sum(schema.contestResult.score).mapWith(Number),
            })
            .from(schema.contestResult)
            .groupBy(schema.contestResult.userId);

        const contestScoreMap = new Map(
            contestScores.map((cs) => [cs.userId, cs.totalScore])
        );

        // Get achievements for each user
        const userAchievements = await db
            .select({
                userId: schema.userAchievements.userId,
                achievementId: schema.userAchievements.achievementId,
            })
            .from(schema.userAchievements);

        const achievementMap = new Map<string, string[]>();
        userAchievements.forEach((ua) => {
            if (!achievementMap.has(ua.userId)) {
                achievementMap.set(ua.userId, []);
            }
            achievementMap.get(ua.userId)!.push(ua.achievementId);
        });

        // Transform and combine data
        return usersWithStats.map((u) => {
            const contestScore = contestScoreMap.get(u.id) || 0;
            const combinedPoints = (u.totalPoints || 0) + contestScore;

            return {
                id: u.id,
                name: u.name,
                email: u.email,
                image: u.image || null,
                stats: {
                    tasksCompleted: u.tasksCompleted || 0,
                    pomodorosCompleted: u.pomodorosCompleted || 0,
                    totalFocusTime: u.totalFocusTime || 0,
                    currentStreak: u.currentStreak || 0,
                    streak: u.currentStreak || 0,
                    longestStreak: u.longestStreak || 0,
                    totalPoints: combinedPoints,
                    level: u.level || 1,
                },
                achievements: achievementMap.get(u.id) || [],
                preferences: {
                    pomodoroLength: 25,
                    breakLength: 5,
                    longBreakLength: 15,
                    pomodorosUntilLongBreak: 4,
                    workHoursStart: "09:00",
                    workHoursEnd: "17:00",
                    wellnessReminders: true,
                    wellnessReminderInterval: 30,
                    notificationsEnabled: true,
                    theme: "dark" as const,
                },
                createdAt: u.createdAt.toISOString(),
            };
        }).sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);
    } catch (error) {
        console.error("Error fetching global leaderboard:", error);
        return [];
    }
};

export const getCurrentUser = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const currentUser = await db.query.user.findFirst({
        where: eq(schema.user.id, session.user.id),
    });

    if (!currentUser) {
        redirect("/login");
    }

    return {
        ...session,
        currentUser
    }
}

export const signIn = async (email: string, password: string) => {
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password,
            }
        })

        return {
            success: true,
            message: "Signed in successfully."
        }
    } catch (error) {
        const e = error as Error

        return {
            success: false,
            message: e.message || "An unknown error occurred."
        }
    }
}

export const signUp = async (email: string, password: string, username: string) => {
    try {
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: username
            }
        })

        return {
            success: true,
            message: "Signed up successfully."
        }
    } catch (error) {
        const e = error as Error

        return {
            success: false,
            message: e.message || "An unknown error occurred."
        }
    }
}