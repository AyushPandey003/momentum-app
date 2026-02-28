import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { isContestAdminUser } from "@/lib/contest-admin";

/**
 * API Route: Create Contest via Go WebSocket Service
 * 
 * This endpoint proxies contest creation requests to the Go WebSocket backend.
 * It handles authentication and forwards the request to create a real-time contest.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check contest creation limit (2 contests per user)
    const userContests = await db.query.contest.findMany({
      where: eq(schema.contest.createdBy, session.user.id)
    });

    if (userContests.length >= 2) {
      return NextResponse.json(
        { error: "You have reached the maximum limit of 2 contests. Please delete an existing contest to create a new one." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { difficulty, questionCount, contestName, description, durationMinutes, emails, startDate, selectedQuestionIds } = body;

    if (!difficulty || !questionCount) {
      return NextResponse.json(
        { error: "difficulty and questionCount are required" },
        { status: 400 }
      );
    }

    const isAdmin = isContestAdminUser(session.user);
    const selectedIds = Array.isArray(selectedQuestionIds)
      ? selectedQuestionIds.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    if (selectedIds.length > 0 && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can create contests from a curated question pool." },
        { status: 403 }
      );
    }

    let validatedQuestionIds: string[] = [];
    if (selectedIds.length > 0) {
      const uniqueSelectedIds = Array.from(new Set(selectedIds));
      const selectedQuestions = await db
        .select({ id: schema.problemSet.id })
        .from(schema.problemSet)
        .where(
          and(
            inArray(schema.problemSet.id, uniqueSelectedIds),
            eq(schema.problemSet.isActive, true)
          )
        );

      validatedQuestionIds = selectedQuestions.map((item) => item.id);

      if (validatedQuestionIds.length !== uniqueSelectedIds.length) {
        return NextResponse.json(
          { error: "Some selected questions are invalid or inactive. Please refresh the pool and try again." },
          { status: 400 }
        );
      }
    }

    const resolvedQuestionCount = validatedQuestionIds.length > 0 ? validatedQuestionIds.length : Number(questionCount);

    if (!Number.isFinite(resolvedQuestionCount) || resolvedQuestionCount < 1) {
      return NextResponse.json(
        { error: "Question count must be at least 1" },
        { status: 400 }
      );
    }

    // Get the Go service URL from environment
    const GO_SERVICE_URL = process.env.GO_WEBSOCKET_SERVICE_URL ;

    // First, get a JWT token for authentication with Go service
    const tokenResponse = await fetch(`${req.nextUrl.origin}/api/contest/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({ contestId: "temp" }), // Temporary ID for auth
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to generate authentication token");
    }

    const { token } = await tokenResponse.json();

    // Call Go service to create contest
    const goResponse = await fetch(`${GO_SERVICE_URL}/api/contests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: contestName || `${session.user.name || 'User'}'s ${difficulty} Contest`,
        difficulty,
        question_count: resolvedQuestionCount,
        duration_minutes: durationMinutes || 30, // Pass duration to Go service
        selected_question_ids: validatedQuestionIds,
      }),
    });

    if (!goResponse.ok) {
      const errorText = await goResponse.text();
      console.error("Go service error:", errorText);
      return NextResponse.json(
        { error: "Failed to create contest in Go service" },
        { status: goResponse.status }
      );
    }

    const contestData = await goResponse.json();
    const wsContestId = contestData.contest_id;

    // Store contest metadata in Next.js database for invitation system
    // This allows us to track invitations, participants, and link to WebSocket contests
    
    // Determine start and end times. Prefer client-provided startDate if present.
    const now = new Date();
    const start = startDate ? new Date(startDate) : now;
    const endDate = new Date(start);
    endDate.setMinutes(endDate.getMinutes() + (durationMinutes || 30));

    // Avoid duplicate insert if Go service already created the contest
    let dbContest;
    const existing = await db.query.contest.findFirst({ where: eq(schema.contest.id, wsContestId) });
    if (existing) {
      // Update existing record with any provided metadata from the modal so fields like
      // description/startDate/endDate are reflected when the modal was used to create the contest.
      const updated = await db
        .update(schema.contest)
        .set({
          name: contestName || existing.name,
          description: description !== undefined ? (description || null) : existing.description,
          startDate: start || existing.startDate,
          endDate: endDate || existing.endDate,
          questionCount: resolvedQuestionCount,
          durationMinutes: durationMinutes || existing.durationMinutes,
          showResultsAfter: endDate || existing.showResultsAfter,
          metadata: {
            ...(existing.metadata || {}),
          },
          updatedAt: now
        })
        .where(eq(schema.contest.id, wsContestId))
        .returning();

      dbContest = updated.length ? updated : [existing];
    } else {
      dbContest = await db.insert(schema.contest).values({
      id: wsContestId, // Use the WebSocket contest ID for consistency
      name: contestName || `${session.user.name || 'User'}'s ${difficulty} Contest`, // Use the name from frontend or fallback
      description: description || null,
      startDate: start,
      endDate: endDate,
      status: "draft", // Will be "in_progress" when organizer starts via WebSocket
      createdBy: session.user.id,
      contestType: "quick_fire", // All WebSocket contests are real-time
      difficulty: difficulty,
      category: null,
      questionCount: resolvedQuestionCount,
      durationMinutes: durationMinutes || 30,
      tags: [],
      showResultsAfter: endDate,
      maxParticipants: 6, // WebSocket service default
      isPrivate: true,
      waitingRoomActive: false,
      metadata: {},
      createdAt: now,
      updatedAt: now
      }).returning();
    }

    // Now insert the questions into the junction table
    if (validatedQuestionIds && validatedQuestionIds.length > 0) {
      const contestQuestionsToInsert = validatedQuestionIds.map((pid: string, idx: number) => ({
        id: `cq_${wsContestId}_${idx}`,
        contestId: wsContestId,
        problemSetId: pid,
        orderIndex: idx
      }));
      
      await db.insert(schema.contestQuestion).values(contestQuestionsToInsert);
    }

    // Automatically add creator as participant (organizer)
    await db.insert(schema.contestParticipant).values({
      id: `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contestId: wsContestId,
      userId: session.user.id,
      username: session.user.name || session.user.email || 'Organizer',
      email: session.user.email || '',
      joinedAt: now,
      score: 0,
      timeSpentSeconds: 0,
      status: "invited",
      isOrganizer: true,
      currentQuestionIndex: 0,
      answeredQuestions: []
    });

    if (validatedQuestionIds.length > 0) {
      await db.delete(schema.contestQuestion).where(eq(schema.contestQuestion.contestId, wsContestId));
      await db.insert(schema.contestQuestion).values(
        validatedQuestionIds.map((problemSetId, orderIndex) => ({
          id: `cq_${Date.now()}_${orderIndex}_${Math.random().toString(36).substr(2, 9)}`,
          contestId: wsContestId,
          problemSetId,
          orderIndex,
        }))
      );
    }

    // Send email invitations if emails provided
    let invitationsSent = 0;
    let invitationErrors: string[] = [];
    
    if (emails && Array.isArray(emails) && emails.length > 0) {
      const validEmails = emails.filter((email: string) => email.trim() !== "");
      
      if (validEmails.length > 0) {
        console.log(`Attempting to send ${validEmails.length} invitation(s) for contest ${wsContestId}`);
        const { inviteToContest } = await import("@/server/contests");
        
        try {
          const invitations = await inviteToContest({
            contestId: wsContestId,
            emails: validEmails
          });
          invitationsSent = invitations.length;
          console.log(`Successfully created ${invitationsSent} invitation(s)`);
        } catch (inviteError) {
          console.error("Error sending invitations:", inviteError);
          invitationErrors.push(inviteError instanceof Error ? inviteError.message : "Unknown error");
          // Don't fail the entire request if invitations fail
        }
      }
    }

    // Return contest details with WebSocket URL
    return NextResponse.json({
      contestId: wsContestId,
      difficulty: contestData.difficulty,
      questionCount: contestData.question_count,
      selectedQuestionCount: validatedQuestionIds.length,
      websocketUrl: contestData.websocket_url,
      message: contestData.message,
      invitationsSent,
      invitationErrors: invitationErrors.length > 0 ? invitationErrors : undefined,
      dbContestCreated: true
    });
  } catch (error) {
    console.error("Error creating contest:", error);
    return NextResponse.json(
      { error: "Failed to create contest" },
      { status: 500 }
    );
  }
}
