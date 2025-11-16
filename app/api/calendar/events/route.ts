import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const timeMin = req.nextUrl.searchParams.get("timeMin");
    const timeMax = req.nextUrl.searchParams.get("timeMax");

    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: "timeMin and timeMax are required" },
        { status: 400 }
      );
    }

    // Get the current user session
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Google account tokens
    const userAccount = await db.query.account.findFirst({
      where: (account, { and }) => and(
        eq(account.userId, session.user.id),
        eq(account.providerId, "google")
      ),
    });

    if (!userAccount?.accessToken || !userAccount?.refreshToken) {
      return NextResponse.json(
        { error: "Calendar not connected. Please connect Google Calendar in Settings." },
        { status: 403 }
      );
    }

    console.log("📅 Fetching calendar events for user:", session.user.id);
    console.log("📅 Account scope:", userAccount.scope);

    // Set up OAuth2 client with user's tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
    );

    oauth2Client.setCredentials({
      access_token: userAccount.accessToken,
      refresh_token: userAccount.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    console.log("✅ Successfully fetched", res.data.items?.length || 0, "calendar events");

    return NextResponse.json(res.data.items || []);
  } catch (error: any) {
    console.error("❌ Error getting calendar events:", error);
    console.error("❌ Error details:", error?.response?.data || error?.message);
    return NextResponse.json(
      { error: error?.message || "Error getting calendar events" },
      { status: error?.code || 500 }
    );
  }
}

// GET a single calendar event by its Google Calendar ID
export async function POST(req: NextRequest) {
  try {
    const { eventId, calendarId = "primary" } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Get the current user session
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Google account tokens
    const userAccount = await db.query.account.findFirst({
      where: (account, { and }) => and(
        eq(account.userId, session.user.id),
        eq(account.providerId, "google")
      ),
    });

    if (!userAccount?.accessToken || !userAccount?.refreshToken) {
      return NextResponse.json(
        { error: "Calendar not connected. Please connect Google Calendar in Settings." },
        { status: 403 }
      );
    }

    // Set up OAuth2 client with user's tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
    );

    oauth2Client.setCredentials({
      access_token: userAccount.accessToken,
      refresh_token: userAccount.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const res = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId,
    });

    console.log("✅ Successfully fetched calendar event:", res.data.id);

    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error("❌ Error getting calendar event:", error);
    console.error("❌ Error details:", error?.response?.data || error?.message);
    return NextResponse.json(
      { error: error?.message || "Error getting calendar event" },
      { status: error?.code || 500 }
    );
  }
}
