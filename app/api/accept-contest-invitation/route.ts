import { NextRequest, NextResponse } from "next/server";
import { getSession } from "next-auth/react";
import { addUserToContest } from "@/server/contests";

export async function POST(req: NextRequest) {
  const session = await getSession({ req });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { contestId } = await req.json();

  if (!contestId) {
    return NextResponse.json({ error: "Contest ID not found" }, { status: 400 });
  }

  try {
    await addUserToContest(contestId, userId);
    return NextResponse.json({ message: "Successfully joined contest" });
  } catch (error) {
    console.error("Error joining contest:", error);
    return NextResponse.json(
      { error: "Error joining contest" },
      { status: 500 }
    );
  }
}
