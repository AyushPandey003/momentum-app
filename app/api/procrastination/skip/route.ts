// API Route: Skip a task (increment skip count)
// POST /api/procrastination/skip

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { task } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { analyticsLogger } from "@/lib/analytics-logger";
import { detectProcrastination } from "@/lib/procrastination-detector";

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
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Get the task
    const existingTask = await db.query.task.findFirst({
      where: and(eq(task.id, taskId), eq(task.userId, session.user.id)),
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Increment skip count
    const newSkipCount = (existingTask.skipCount || 0) + 1;
    
    await db
      .update(task)
      .set({ skipCount: newSkipCount })
      .where(eq(task.id, taskId));

    // Log skip event to MongoDB
    const userSnapshot = await analyticsLogger.getUserSnapshot(session.user.id);
    await analyticsLogger.logTaskSkipped({
      userId: session.user.id,
      taskId: existingTask.id,
      title: existingTask.title,
      priority: existingTask.priority as any,
      dueDate: existingTask.dueDate,
      currentSkipCount: newSkipCount,
      tags: existingTask.tags as string[],
      userSnapshot,
    });

    // Check if this skip triggers any alerts
    const allTasks = await db.query.task.findMany({
      where: eq(task.userId, session.user.id),
    });
    
    const updatedTask = { ...existingTask, skipCount: newSkipCount };
    const alert = await detectProcrastination(
      updatedTask as any,
      allTasks as any,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      skipCount: newSkipCount,
      alert: alert || null,
      message: alert ? alert.message : "Task skipped",
    });
  } catch (error) {
    console.error("Error skipping task:", error);
    return NextResponse.json(
      { error: "Failed to skip task" },
      { status: 500 }
    );
  }
}
