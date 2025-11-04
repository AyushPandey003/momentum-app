import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { task } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id: taskId } = await params;

  try {
    const body = await req.json();
    const {
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
      createdAt,
      completedAt,
      aiDecomposed,
      managerEmail,
      verificationImageUrl,
    } = body;

    const updated = await db
      .update(task)
      .set({
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
        createdAt,
        completedAt,
        aiDecomposed,
        managerEmail,
        verificationImageUrl,
      })
      .where(and(eq(task.id, taskId), eq(task.userId, userId)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Error updating task" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id: taskId } = await params;

  try {
    const deleted = await db
      .delete(task)
      .where(and(eq(task.id, taskId), eq(task.userId, userId)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Error deleting task" },
      { status: 500 }
    );
  }
}
