// API Route: Trigger AI Coaching Intervention (Phase 2)
// POST /api/coaching/trigger

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { task } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { analyticsLogger } from "@/lib/analytics-logger";

// Note: Install @google/generative-ai if not already installed
// This uses Google Gemini for AI coaching
async function getAICoachingMessage(data: {
  taskTitle: string;
  taskPriority: string;
  hoursUntilDue: number;
  skipCount: number;
  taskDescription: string;
}): Promise<string> {
  try {
    // Check if we have the API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn('GOOGLE_GEMINI_API_KEY not set, using fallback message');
      return generateFallbackMessage(data);
    }

    // Dynamically import to avoid build errors if package not installed
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are Momentum, an empathetic and motivating productivity coach. Your user is procrastinating on a task and needs your help to get started.

Task Details:
- Title: "${data.taskTitle}"
- Description: "${data.taskDescription}"
- Priority: ${data.taskPriority}
- Due in: ${data.hoursUntilDue} hours
- Times skipped: ${data.skipCount}

Write a short (2-3 sentences), empathetic, and actionable message to help them overcome this procrastination and start the task. Be warm, understanding, and provide a specific, tiny first step they can take right now. Don't use bullet points or formatting - just natural, conversational text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    return text || generateFallbackMessage(data);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return generateFallbackMessage(data);
  }
}

function generateFallbackMessage(data: {
  taskTitle: string;
  taskPriority: string;
  hoursUntilDue: number;
  skipCount: number;
}): string {
  const messages = [
    `I notice you've been putting off "${data.taskTitle}" - that's totally normal for challenging tasks! Let's break the ice: spend just 2 minutes looking at what you need to do, without any pressure to actually do it. Often, starting is the hardest part.`,
    `Hey, I see "${data.taskTitle}" has been hanging over you. Instead of tackling the whole thing, can you identify just ONE tiny piece you could finish in the next 5 minutes? Sometimes we just need a small win to build momentum.`,
    `"${data.taskTitle}" has been on your list for a while. What's making it hard to start? Is it too big, unclear, or just not appealing? Let's figure it out together and find a way to make it feel more manageable.`,
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

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
    const { taskId, severity } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Get the task
    const taskData = await db.query.task.findFirst({
      where: and(eq(task.id, taskId), eq(task.userId, session.user.id)),
    });

    if (!taskData) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Calculate hours until due
    const dueDate = new Date(taskData.dueDate);
    const now = new Date();
    const hoursUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    // Get AI coaching message
    const prompt = `Task: ${taskData.title}, Priority: ${taskData.priority}, Due in: ${hoursUntilDue}h, Skipped: ${taskData.skipCount} times`;
    const coachingMessage = await getAICoachingMessage({
      taskTitle: taskData.title,
      taskPriority: taskData.priority,
      hoursUntilDue,
      skipCount: taskData.skipCount || 0,
      taskDescription: taskData.description,
    });

    // Generate intervention ID
    const interventionId = `int_${Date.now()}_${taskId}`;

    // Log AI intervention to MongoDB
    try {
      const userSnapshot = await analyticsLogger.getUserSnapshot(session.user.id);
      await analyticsLogger.logAIInterventionTriggered({
        userId: session.user.id,
        interventionId,
        taskId: taskData.id,
        title: taskData.title,
        triggerType: 'rule', // Phase 3 will use 'model'
        promptSent: prompt,
        llmResponse: coachingMessage,
        modelUsed: process.env.GOOGLE_GEMINI_API_KEY ? 'gemini-1.5-flash' : 'fallback',
        severity: (severity as any) || 'high',
        context: {
          skipCount: taskData.skipCount || 0,
          hoursUntilDue,
        },
        userSnapshot,
      });
    } catch (error) {
      console.error('Failed to log AI intervention:', error);
    }

    return NextResponse.json({
      success: true,
      interventionId,
      message: coachingMessage,
      taskId: taskData.id,
      taskTitle: taskData.title,
    });
  } catch (error) {
    console.error("Error triggering AI coaching:", error);
    return NextResponse.json(
      { error: "Failed to trigger AI coaching" },
      { status: 500 }
    );
  }
}
