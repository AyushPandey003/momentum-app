import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

    const body = await req.json();
    const { difficulty, questionCount, contestName, description, durationMinutes, emails } = body;

    if (!difficulty || !questionCount) {
      return NextResponse.json(
        { error: "difficulty and questionCount are required" },
        { status: 400 }
      );
    }

    // Get the Go service URL from environment
    const GO_SERVICE_URL = process.env.GO_WEBSOCKET_SERVICE_URL || "http://localhost:8080";

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
        question_count: questionCount,
        duration_minutes: durationMinutes || 30, // Pass duration to Go service
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
    const { db } = await import("@/db/drizzle");
    const { schema } = await import("@/db/schema");
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMinutes(endDate.getMinutes() + (durationMinutes || 30));

    const dbContest = await db.insert(schema.contest).values({
      id: wsContestId, // Use the WebSocket contest ID for consistency
      name: contestName || `${session.user.name || 'User'}'s ${difficulty} Contest`, // Use the name from frontend or fallback
      description: description || null,
      startDate: now,
      endDate: endDate,
      status: "draft", // Will be "in_progress" when organizer starts via WebSocket
      createdBy: session.user.id,
      contestType: "quick_fire", // All WebSocket contests are real-time
      difficulty: difficulty,
      category: null,
      questionCount: questionCount,
      durationMinutes: durationMinutes || 30,
      tags: [],
      showResultsAfter: endDate,
      maxParticipants: 6, // WebSocket service default
      isPrivate: true,
      waitingRoomActive: false,
      createdAt: now,
      updatedAt: now
    }).returning();

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
