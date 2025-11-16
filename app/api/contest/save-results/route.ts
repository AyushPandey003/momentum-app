import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST endpoint for Go backend to save all contest data in one bulk operation
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    const {
      contestId,
      questions,    // Array of { problemSetId, orderIndex } - contest questions
      results,      // Array of { userId, username, score, rank, timeSpent }
      answers,      // Array of { userId, questionId, answer, isCorrect, timeTaken (int ms), pointsAwarded }
      submissions,  // Array of { userId, questionId, problemSetId, answer, selectedAnswer, isCorrect, pointsEarned, timeSpentSeconds, submittedAt }
      contestStatus = "finished"
    } = data;

    if (!contestId) {
      return NextResponse.json(
        { error: "Contest ID is required" },
        { status: 400 }
      );
    }

    // Start a transaction for atomic operations
    await db.transaction(async (tx) => {
      // 1. Ensure contest questions are in the database
      if (questions && questions.length > 0) {
        for (const question of questions) {
          // Check if contest question already exists
          const existing = await tx
            .select()
            .from(schema.contestQuestion)
            .where(
              and(
                eq(schema.contestQuestion.contestId, contestId),
                eq(schema.contestQuestion.problemSetId, question.problemSetId)
              )
            )
            .limit(1);

          if (existing.length === 0) {
            // Insert contest question if it doesn't exist
            await tx.insert(schema.contestQuestion).values({
              id: `cq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              contestId,
              problemSetId: question.problemSetId,
              orderIndex: question.orderIndex
            });
          }
        }
      }

      // 2. Update contest status
      await tx
        .update(schema.contest)
        .set({ 
          status: contestStatus
        })
        .where(eq(schema.contest.id, contestId));

      // 3. Bulk insert contest results (final rankings)
      if (results && results.length > 0) {
        const contestResultsData = results.map((result: any) => ({
          id: `cr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${result.userId}`,
          contestId,
          userId: result.userId,
          username: result.username,
          score: result.score || 0,
          rank: result.rank,
          completedAt: new Date(),
          createdAt: new Date()
        }));

        // Check if results already exist to avoid duplicates
                const existingResults = await tx
                  .select({ userId: schema.contestResult.userId })
                  .from(schema.contestResult)
                  .where(eq(schema.contestResult.contestId, contestId));
        
                const existingUserIds = new Set(existingResults.map((r: any) => r.userId));
                const newResults = contestResultsData.filter((r: any) => !existingUserIds.has(r.userId));
        
                if (newResults.length > 0) {
                  await tx.insert(schema.contestResult).values(newResults);
                }
      }

      // 4. Bulk insert player answers (for detailed answer tracking)
      if (answers && answers.length > 0) {
        const playerAnswersData = answers.map((answer: any) => ({
          id: `pa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contestId,
          userId: answer.userId,
          questionId: answer.questionId,
          answerGiven: answer.answer,
          isCorrect: answer.isCorrect || false,
          timeTaken: Math.round(answer.timeTaken || 0), // Ensure it's an integer (milliseconds)
          pointsAwarded: answer.pointsAwarded || 0,
          answeredAt: answer.answeredAt ? new Date(answer.answeredAt) : new Date(),
          createdAt: new Date()
        }));

        // Insert player answers (allow duplicates if question was answered multiple times)
        if (playerAnswersData.length > 0) {
          await tx.insert(schema.playerAnswer).values(playerAnswersData);
        }
      }

      // 5. Bulk insert/update contest submissions
      if (submissions && submissions.length > 0) {
        const submissionDataArray = submissions.map((submission: any) => ({
          id: `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contestId,
          userId: submission.userId,
          problemSetId: submission.problemSetId || submission.questionId, // Use problemSetId if provided, fallback to questionId
          selectedAnswer: submission.selectedAnswer || submission.answer || "",
          isCorrect: submission.isCorrect || false,
          pointsEarned: submission.pointsEarned || submission.pointsAwarded || 0,
          timeSpentSeconds: Math.max(1, Math.round(submission.timeSpentSeconds || 0)), // Ensure at least 1 second if provided
          submittedAt: submission.submittedAt ? new Date(submission.submittedAt) : new Date(),
          createdAt: new Date()
        }));

        // Bulk insert all submissions
        if (submissionDataArray.length > 0) {
          await tx.insert(schema.contestSubmission).values(submissionDataArray);
        }
      }

      // 6. Update contest participants with final scores and time
      if (results && results.length > 0) {
        for (const result of results) {
          const participants = await tx
            .select()
            .from(schema.contestParticipant)
            .where(
              eq(schema.contestParticipant.userId, result.userId)
            )
            .limit(1);

          if (participants.length > 0) {
            await tx
              .update(schema.contestParticipant)
              .set({
                score: result.score || 0,
                timeSpentSeconds: result.timeSpent || 0,
                submittedAt: new Date()
              })
              .where(
                eq(schema.contestParticipant.id, participants[0].id)
              );
          }
        }
      }

      // 7. Update user stats with contest points and check for achievements
      if (results && results.length > 0) {
        for (const result of results) {
          // Get or create user stats
          const existingStats = await tx.query.userStats.findFirst({
            where: eq(schema.userStats.userId, result.userId)
          });

          if (existingStats) {
            // Update existing stats
            await tx
              .update(schema.userStats)
              .set({
                totalPoints: existingStats.totalPoints + (result.score || 0)
              })
              .where(eq(schema.userStats.userId, result.userId));
          } else {
            // Create new stats
            await tx.insert(schema.userStats).values({
              id: `us_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: result.userId,
              totalPoints: result.score || 0,
              level: 1,
              streak: 0,
              currentStreak: 0,
              longestStreak: 0,
              tasksCompleted: 0,
              pomodorosCompleted: 0,
              totalFocusTime: 0
            });
          }

          // Check for achievements
          // Get updated stats
          const updatedStats = await tx.query.userStats.findFirst({
            where: eq(schema.userStats.userId, result.userId)
          });

          // Get user's contest wins
          const userResults = await tx
            .select({ rank: schema.contestResult.rank })
            .from(schema.contestResult)
            .where(eq(schema.contestResult.userId, result.userId));

          const winsCount = userResults.filter(r => r.rank === 1).length;
          const totalPoints = updatedStats?.totalPoints || 0;

          // Check achievement conditions and insert if earned
          const achievementsToUnlock = [];

          if (totalPoints >= 10000) {
            achievementsToUnlock.push("contest_points_10k");
          }
          if (totalPoints >= 20000 && winsCount >= 2) {
            achievementsToUnlock.push("contest_points_20k_2wins");
          }
          if (winsCount >= 5) {
            achievementsToUnlock.push("contest_wins_5");
          }

          // Insert achievements that don't already exist
          for (const achievementId of achievementsToUnlock) {
            const existingAchievement = await tx.query.userAchievements.findFirst({
              where: (userAchievements, { and }) => 
                and(
                  eq(userAchievements.userId, result.userId),
                  eq(userAchievements.achievementId, achievementId)
                )
            });

            if (!existingAchievement) {
              await tx.insert(schema.userAchievements).values({
                id: `ua_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: result.userId,
                achievementId,
                unlockedAt: new Date().toISOString()
              });
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Contest data saved successfully",
      recordsProcessed: {
        questions: questions?.length || 0,
        results: results?.length || 0,
        answers: answers?.length || 0,
        submissions: submissions?.length || 0
      }
    });

  } catch (error) {
    console.error("Error saving contest results:", error);
    return NextResponse.json(
      { 
        error: "Failed to save contest results",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
