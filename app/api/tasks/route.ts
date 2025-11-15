import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { task } from "@/db/schema";
import { eq } from "drizzle-orm";
import { analyticsLogger } from "@/lib/analytics-logger";

// GET all tasks for user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tasks = await db.query.task.findMany({
      where: eq(task.userId, session.user.id),
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST create new task
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
    const {
      id,
      title,
      description,
      dueDate,
      priority,
      status,
      estimatedTime,
      actualTime,
      tags,
      subtasks,
      source,
      sourceId,
      aiDecomposed,
      managerEmail,
      verificationImageUrl,
    } = body;

    // Insert task into database
    const newTask = await db.insert(task).values({
      id: id || crypto.randomUUID(),
      userId: session.user.id,
      title,
      description,
      dueDate,
      priority: priority || "medium",
      status: status || "todo",
      estimatedTime: estimatedTime || 60,
      actualTime: actualTime || 0,
      tags: tags || [],
      subtasks: subtasks || [],
      source: source || "manual",
      sourceId: sourceId || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      aiDecomposed: aiDecomposed || false,
      managerEmail: managerEmail || null,
      verificationImageUrl: verificationImageUrl || null,
      skipCount: 0,
    }).returning();

    // Log task creation to MongoDB Analytics
    try {
      const userSnapshot = await analyticsLogger.getUserSnapshot(session.user.id);
      await analyticsLogger.logTaskCreated({
        userId: session.user.id,
        taskId: newTask[0].id,
        title: newTask[0].title,
        priority: newTask[0].priority as any,
        dueDate: newTask[0].dueDate,
        estimatedTime: newTask[0].estimatedTime,
        aiDecomposed: newTask[0].aiDecomposed,
        tags: newTask[0].tags as string[],
        source: newTask[0].source as any,
        userSnapshot,
      });
    } catch (error) {
      console.error('Failed to log task creation:', error);
    }

    return NextResponse.json({
      success: true,
      task: newTask[0],
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
