import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq } from "drizzle-orm";

async function checkContestSetup() {
  console.log("🔍 Checking Contest Setup...\n");

  try {
    // Check problem sets
    console.log("📚 Problem Sets:");
    const problemSets = await db.select().from(schema.problemSet);
    console.log(`   Total questions: ${problemSets.length}`);

    if (problemSets.length === 0) {
      console.log("   ⚠️  No questions found! Run: pnpm run seed:questions");
    } else {
      // Group by category
      const byCategory = problemSets.reduce((acc, ps) => {
        acc[ps.category] = (acc[ps.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("   By category:");
      Object.entries(byCategory).forEach(([cat, count]) => {
        console.log(`     - ${cat}: ${count}`);
      });

      // Group by difficulty
      const byDifficulty = problemSets.reduce((acc, ps) => {
        acc[ps.difficulty] = (acc[ps.difficulty] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("   By difficulty:");
      Object.entries(byDifficulty).forEach(([diff, count]) => {
        console.log(`     - ${diff}: ${count}`);
      });

      // Check active status
      const activeCount = problemSets.filter(ps => ps.isActive).length;
      const inactiveCount = problemSets.length - activeCount;
      console.log(`   Active: ${activeCount}, Inactive: ${inactiveCount}`);
    }

    // Check contests
    console.log("\n🏆 Contests:");
    const contests = await db.select().from(schema.contest);
    console.log(`   Total contests: ${contests.length}`);

    if (contests.length > 0) {
      // Group by status
      const byStatus = contests.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("   By status:");
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });

      // Check recent contests
      const recentContests = contests
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      console.log("\n   Recent contests:");
      for (const contest of recentContests) {
        // Check how many questions this contest has
        const contestQuestions = await db
          .select()
          .from(schema.contestQuestion)
          .where(eq(schema.contestQuestion.contestId, contest.id));

        console.log(
          `     - ${contest.name} (${contest.status}): ${contestQuestions.length} questions`
        );

        if (contestQuestions.length === 0) {
          console.log(
            `       ⚠️  No questions assigned! This contest won't work.`
          );
        }
      }
    }

    // Check contest participants
    console.log("\n👥 Participants:");
    const participants = await db.select().from(schema.contestParticipant);
    console.log(`   Total participations: ${participants.length}`);

    // Check contest invitations
    console.log("\n✉️  Invitations:");
    const invitations = await db.select().from(schema.contestInvitation);
    console.log(`   Total invitations: ${invitations.length}`);

    if (invitations.length > 0) {
      const byStatus = invitations.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("   By status:");
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });
    }

    // Check submissions
    console.log("\n📝 Submissions:");
    const submissions = await db.select().from(schema.contestSubmission);
    console.log(`   Total submissions: ${submissions.length}`);

    if (submissions.length > 0) {
      const correct = submissions.filter(s => s.isCorrect).length;
      const incorrect = submissions.length - correct;
      const accuracy = ((correct / submissions.length) * 100).toFixed(1);
      console.log(
        `   Correct: ${correct}, Incorrect: ${incorrect} (${accuracy}% accuracy)`
      );
    }

    // Overall health check
    console.log("\n💚 Health Check:");
    const issues = [];

    if (problemSets.length === 0) {
      issues.push("No questions in database");
    }

    if (contests.length > 0) {
      const contestsWithoutQuestions = [];
      for (const contest of contests) {
        const contestQuestions = await db
          .select()
          .from(schema.contestQuestion)
          .where(eq(schema.contestQuestion.contestId, contest.id));

        if (contestQuestions.length === 0) {
          contestsWithoutQuestions.push(contest.name);
        }
      }

      if (contestsWithoutQuestions.length > 0) {
        issues.push(
          `Contests without questions: ${contestsWithoutQuestions.join(", ")}`
        );
      }
    }

    if (issues.length === 0) {
      console.log("   ✅ Everything looks good!");
    } else {
      console.log("   ⚠️  Issues found:");
      issues.forEach(issue => console.log(`     - ${issue}`));
    }

    // Recommendations
    console.log("\n💡 Recommendations:");
    if (problemSets.length === 0) {
      console.log("   1. Run: pnpm run seed:questions");
    } else if (problemSets.length < 20) {
      console.log("   1. Consider adding more questions for variety");
    }

    if (contests.length === 0) {
      console.log("   2. Create your first contest at /dashboard/contest");
    }

    console.log("\n✨ Check complete!");
  } catch (error) {
    console.error("\n❌ Error during check:", error);
    console.error(
      "\nMake sure your database connection is properly configured in .env"
    );
    process.exit(1);
  }
}

// Run the check
checkContestSetup()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
