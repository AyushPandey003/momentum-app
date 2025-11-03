import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/dashboard/tasks?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    // Check if authorization code is present
    if (!code) {
      return NextResponse.redirect(
        new URL("/dashboard/tasks?error=missing_code", req.url)
      );
    }

    // Get the current user session
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized&redirect=/dashboard/tasks", req.url)
      );
    }

    // Exchange authorization code for tokens
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/email/gmail/callback`
    );

    const { tokens } = await oAuth2Client.getToken(code);
    
    if (!tokens.refresh_token || !tokens.access_token) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=token_error", req.url)
      );
    }

    // Store the tokens in the database
    // You'll need to add a table for storing user calendar credentials
    // For now, we'll update the user record if there's a field for it
    // Or you can create a separate calendarCredentials table
    
    // Example: Update user with calendar connection status
    await db
      .update(schema.user)
      .set({
        // If you have fields for storing tokens, add them here
        // Otherwise, create a separate table for calendar credentials
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, session.user.id));

    // Store tokens securely (consider encryption in production)
    // For now, redirect with success
    return NextResponse.redirect(
      new URL("/dashboard/tasks?success=calendar_connected", req.url)
    );
  } catch (error) {
    console.error("Error in calendar callback:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/tasks?error=${encodeURIComponent("callback_failed")}`,
        req.url
      )
    );
  }
}
