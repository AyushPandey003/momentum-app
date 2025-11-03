import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { task } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    const { taskId, title, description, estimatedTime } = body;

    // Call backend AI for task decomposition
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    
    let subtasks;
    try {
      const decomposeResponse = await fetch(`${backendUrl}/api/tasks/ai-decompose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          title,
          description,
          estimatedTime,
        }),
      });

      if (decomposeResponse.ok) {
        const data = await decomposeResponse.json();
        subtasks = data.subtasks;
      } else {
        throw new Error("Backend decomposition failed");
      }
    } catch (error) {
      console.error("Backend AI decomposition error:", error);
      // Fallback to local generation
      subtasks = generateMockSubtasks(title, description, estimatedTime);
    }

    // Update task in database with subtasks
    try {
      await db
        .update(task)
        .set({
          subtasks: subtasks,
          aiDecomposed: true,
        })
        .where(eq(task.id, taskId));
    } catch (dbError) {
      console.error("Database update error:", dbError);
      // Continue even if DB update fails
    }

    return NextResponse.json({
      success: true,
      subtasks,
      message: "Task decomposed successfully with AI",
    });
  } catch (error) {
    console.error("Error decomposing task:", error);
    return NextResponse.json(
      { error: "Failed to decompose task" },
      { status: 500 }
    );
  }
}

function generateMockSubtasks(title: string, description: string, estimatedTime: number) {
  // Mock subtask generation based on common academic tasks
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes("essay") || lowerTitle.includes("paper") || lowerTitle.includes("research")) {
    return [
      {
        id: crypto.randomUUID(),
        title: "Conduct initial research and gather sources",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.25),
      },
      {
        id: crypto.randomUUID(),
        title: "Create detailed outline and thesis statement",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.15),
      },
      {
        id: crypto.randomUUID(),
        title: "Write first draft (introduction and body)",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.35),
      },
      {
        id: crypto.randomUUID(),
        title: "Write conclusion and revise for clarity",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.15),
      },
      {
        id: crypto.randomUUID(),
        title: "Proofread and format citations",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.10),
      },
    ];
  }
  
  if (lowerTitle.includes("presentation") || lowerTitle.includes("slides")) {
    return [
      {
        id: crypto.randomUUID(),
        title: "Outline key points and structure",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.20),
      },
      {
        id: crypto.randomUUID(),
        title: "Create slide deck and visual content",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.40),
      },
      {
        id: crypto.randomUUID(),
        title: "Write speaker notes",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.15),
      },
      {
        id: crypto.randomUUID(),
        title: "Practice and refine delivery",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.25),
      },
    ];
  }
  
  if (lowerTitle.includes("study") || lowerTitle.includes("exam") || lowerTitle.includes("test")) {
    return [
      {
        id: crypto.randomUUID(),
        title: "Review course materials and notes",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.30),
      },
      {
        id: crypto.randomUUID(),
        title: "Create study guide or flashcards",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.25),
      },
      {
        id: crypto.randomUUID(),
        title: "Practice with sample questions",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.30),
      },
      {
        id: crypto.randomUUID(),
        title: "Final review and concept reinforcement",
        completed: false,
        estimatedTime: Math.floor(estimatedTime * 0.15),
      },
    ];
  }

  // Generic breakdown for other tasks
  const numSubtasks = Math.max(3, Math.min(5, Math.floor(estimatedTime / 30)));
  const timePerSubtask = Math.floor(estimatedTime / numSubtasks);
  
  return Array.from({ length: numSubtasks }, (_, i) => ({
    id: crypto.randomUUID(),
    title: `Step ${i + 1}: Complete part of "${title}"`,
    completed: false,
    estimatedTime: timePerSubtask,
  }));
}
