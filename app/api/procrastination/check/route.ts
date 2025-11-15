// API Route: Check procrastination alerts for current user
// GET /api/procrastination/check

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { task } from "@/db/schema";
import { eq } from "drizzle-orm";
import { detectProcrastinationBatch } from "@/lib/procrastination-detector";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all tasks for the user
    const userTasks = await db.query.task.findMany({
      where: eq(task.userId, session.user.id),
    });

    // Run procrastination detection
    const alerts = await detectProcrastinationBatch(userTasks as any, session.user.id);

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error("Error checking procrastination:", error);
    return NextResponse.json(
      { error: "Failed to check procrastination alerts" },
      { status: 500 }
    );
  }
}
