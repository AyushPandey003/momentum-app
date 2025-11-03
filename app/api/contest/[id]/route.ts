import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/drizzle"
import { contest } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contestId } = await params

    // Fetch contest details
    const contestData = await db
      .select()
      .from(contest)
      .where(eq(contest.id, contestId))
      .limit(1)

    if (!contestData || contestData.length === 0) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(contestData[0])
  } catch (error) {
    console.error("Error fetching contest:", error)
    return NextResponse.json(
      { error: "Failed to fetch contest details" },
      { status: 500 }
    )
  }
}
