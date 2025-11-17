import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { account, scheduleBlock } from "@/db/schema";
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
    const { taskId, title, description, dueDate, estimatedTime, priority } = body;

    // Step 1: Call backend AI for smart scheduling
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    let aiSchedule;
    try {
      const scheduleResponse = await fetch(`${backendUrl}/schedule/smart-lms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          userId: session.user.id,
          title,
          description,
          dueDate,
          estimatedTime,
          priority,
          userEnergyPattern: {
            peak_hours: [9, 10, 11, 14, 15, 16],
            low_hours: [12, 13, 20, 21, 22],
            preferred_work_start: 9,
            preferred_work_end: 18,
          },
        }),
      });

      if (scheduleResponse.ok) {
        aiSchedule = await scheduleResponse.json();
      } else {
        throw new Error("Backend scheduling failed");
      }
    } catch (error) {
      console.error("Backend AI scheduling error:", error);
      // Fallback to simple scheduling
      const startTime = new Date(dueDate);
      startTime.setHours(startTime.getHours() - Math.ceil(estimatedTime / 60));
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + estimatedTime);
      
      aiSchedule = {
        success: true,
        optimalSlot: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          reason: "Scheduled before deadline",
          energyLevel: "medium",
        },
      };
    }

    // Step 2: Save schedule to database
    try {
      const scheduleId = crypto.randomUUID();
      await db.insert(scheduleBlock).values({
        id: scheduleId,
        userId: session.user.id,
        taskId: taskId,
        title: title,
        description: description || null,
        startTime: aiSchedule.optimalSlot.startTime,
        endTime: aiSchedule.optimalSlot.endTime,
        type: "task",
        status: "scheduled",
        pomodoroCount: aiSchedule.optimalSlot.pomodoroBlocks?.length || null,
        createdAt: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error("Database schedule save error:", dbError);
      // Continue even if DB save fails
    }

    // Step 3: Try to create Google Calendar event if user has connected
    let calendarEvent = null;
    let calendarError = null;
    try {
      // Get user's Google account tokens (providerId should be "google")
      const userAccount = await db.query.account.findFirst({
        where: (account, { and }) => and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "google")
        ),
      });

      console.log("📅 Calendar check - Account found:", !!userAccount);
      console.log("📅 Calendar check - Provider ID:", userAccount?.providerId);
      console.log("📅 Calendar check - Has access token:", !!userAccount?.accessToken);
      console.log("📅 Calendar check - Has refresh token:", !!userAccount?.refreshToken);
      console.log("📅 Calendar check - Scope:", userAccount?.scope);

      if (userAccount?.accessToken && userAccount?.refreshToken) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
          access_token: userAccount.accessToken,
          refresh_token: userAccount.refreshToken,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const event = {
          summary: `📚 ${title}`,
          description: `${description || ""}\n\n🎯 Priority: ${priority}\n⏱️ Estimated: ${estimatedTime} min\n\n✨ Scheduled by Momentum AI\nReason: ${aiSchedule.optimalSlot.reason}`,
          start: {
            dateTime: aiSchedule.optimalSlot.startTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: aiSchedule.optimalSlot.endTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          colorId: priority === "urgent" ? "11" : priority === "high" ? "6" : "7",
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 10 },
              { method: "popup", minutes: 30 },
            ],
          },
        };

        console.log("📅 Creating calendar event:", event.summary);

        const response = await calendar.events.insert({
          calendarId: "primary",
          requestBody: event,
        });

        calendarEvent = response.data;
        console.log("✅ Calendar event created successfully:", calendarEvent.id);
      } else {
        calendarError = "Calendar not connected. Please connect Google Calendar in Settings.";
        console.log("⚠️ User has not connected Google Calendar");
      }
    } catch (error: any) {
      console.error("❌ Google Calendar creation error:", error);
      console.error("❌ Error details:", error?.response?.data || error?.message);
      calendarError = error?.message || "Failed to create calendar event";
      // Continue even if calendar fails - schedule is still saved to DB
    }

    return NextResponse.json({
      success: true,
      event: calendarEvent,
      schedule: aiSchedule.optimalSlot,
      calendarConnected: !!calendarEvent,
      calendarError: calendarError,
      message: calendarEvent 
        ? "Task scheduled to your Google Calendar with AI optimization!" 
        : "Task scheduled successfully! Connect Google Calendar to sync.",
    });
  } catch (error) {
    console.error("Error scheduling to calendar:", error);
    return NextResponse.json(
      { error: "Failed to schedule task to calendar" },
      { status: 500 }
    );
  }
}
