import { NextRequest, NextResponse } from "next/server";
import { deleteTask as dbDeleteTask, getTasks, saveTask as dbSaveTask } from "@/lib/data";
import { deleteCalendarEvent } from "@/lib/calendar";
import { updateCalendarEvent } from "@/lib/calendar";
import { getSession } from "next-auth/react";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession({ req });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const taskId = params.id;

  const tasks = getTasks(userId);
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  try {
    const updatedTaskData = await req.json();
    const updatedTask = { ...task, ...updatedTaskData };

    if (updatedTask.calendarEventId) {
      await updateCalendarEvent(updatedTask.calendarEventId, updatedTask);
    }

    dbSaveTask(userId, updatedTask);

    return NextResponse.json(updatedTask);
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
  { params }: { params: { id: string } }
) {
  const session = await getSession({ req });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const taskId = params.id;

  const tasks = getTasks(userId);
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  try {
    if (task.calendarEventId) {
      await deleteCalendarEvent(task.calendarEventId);
    }

    dbDeleteTask(userId, taskId);

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Error deleting task" },
      { status: 500 }
    );
  }
}
