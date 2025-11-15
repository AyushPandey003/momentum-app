// API Route: Submit feedback on AI intervention (Phase 2)
// POST /api/coaching/feedback

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { analyticsLogger } from "@/lib/analytics-logger";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { interventionId, taskId, feedback, interventionTimestamp } = body;

    if (!interventionId || !taskId || !feedback) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!['positive', 'negative', 'neutral'].includes(feedback)) {
      return NextResponse.json(
        { error: "Invalid feedback value" },
        { status: 400 }
      );
    }

    // Log feedback to MongoDB - This is CRITICAL for Phase 3 ML model training
    const userSnapshot = await analyticsLogger.getUserSnapshot(session.user.id);
    await analyticsLogger.logAIFeedbackReceived({
      userId: session.user.id,
      interventionId,
      taskId,
      feedback: feedback as 'positive' | 'negative' | 'neutral',
      interventionTimestamp: interventionTimestamp || new Date().toISOString(),
      userSnapshot,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback recorded successfully",
    });
  } catch (error) {
    console.error("Error recording feedback:", error);
    return NextResponse.json(
      { error: "Failed to record feedback" },
      { status: 500 }
    );
  }
}
