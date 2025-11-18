import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  // FIX: Properly type the context argument for Next.js 15
  props: { params: Promise<{ id: string }> }
) {
  try {
    // FIX: Await the params Promise
    const params = await props.params;
    const contestId = params.id;

    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the contest to get creator info
    const contestData = await db.query.contest.findFirst({
      where: eq(schema.contest.id, contestId),
    });

    if (!contestData) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    // Fetch participant record to check if user is organizer
    const participant = await db.query.contestParticipant.findFirst({
      where: and(
        eq(schema.contestParticipant.contestId, contestId),
        eq(schema.contestParticipant.userId, session.user.id)
      ),
    });

    // If no participant record exists yet, check if user is the creator
    const isCreator = contestData.createdBy === session.user.id;
    
    if (!participant) {
      // User is not yet a participant, but might be the creator
      return NextResponse.json({
        isOrganizer: isCreator,
        creatorId: contestData.createdBy,
        userId: session.user.id,
        isParticipant: false
      });
    }

    return NextResponse.json({
      isOrganizer: participant.isOrganizer || isCreator,
      creatorId: contestData.createdBy,
      userId: session.user.id,
      isParticipant: true
    });
  } catch (error) {
    console.error("Error fetching participant status:", error);
    return NextResponse.json(
      { error: "Failed to fetch participant status" },
      { status: 500 }
    );
  }
}