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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl.replace(/\/$/, '')}/api/calendar/callback`;
    
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl
    );

    console.log("🔄 Exchanging code for tokens...");
    console.log("🔄 Using callback URL:", callbackUrl);

    const { tokens } = await oAuth2Client.getToken(code);
    
    console.log("🔑 Tokens received - Access token:", !!tokens.access_token);
    console.log("🔑 Tokens received - Refresh token:", !!tokens.refresh_token);
    console.log("🔑 Token expiry:", tokens.expiry_date);
    
    if (!tokens.refresh_token || !tokens.access_token) {
      console.error("❌ Missing tokens - Access:", !!tokens.access_token, "Refresh:", !!tokens.refresh_token);
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=token_error", req.url)
      );
    }

    // Store the tokens in the account table
    // Look for the user's Google OAuth account (created during sign-in)
    const existingGoogleAccount = await db.query.account.findFirst({
      where: (account, { and }) => and(
        eq(account.userId, session.user.id),
        eq(account.providerId, "google")
      ),
    });

    const now = new Date();

    if (existingGoogleAccount) {
      // Update existing Google account with calendar tokens and scope
      await db
        .update(schema.account)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingGoogleAccount.refreshToken, // Keep old refresh token if new one not provided
          accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: "https://www.googleapis.com/auth/calendar", // Add calendar scope
          updatedAt: now,
        })
        .where(eq(schema.account.id, existingGoogleAccount.id));
      
      console.log("✅ Updated Google account with calendar tokens for user:", session.user.id);
      console.log("✅ Account ID:", existingGoogleAccount.id);
    } else {
      // Create new Google account record (fallback if user didn't sign in with Google)
      const accountData = {
        id: `google_calendar_${session.user.id}_${Date.now()}`,
        userId: session.user.id,
        accountId: session.user.email || session.user.id,
        providerId: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: "https://www.googleapis.com/auth/calendar",
        createdAt: now,
        updatedAt: now,
      };
      
      await db.insert(schema.account).values(accountData);
      console.log("✅ Created new Google account with calendar tokens for user:", session.user.id);
    }

    return NextResponse.redirect(
      new URL("/dashboard/calendar?success=calendar_connected", req.url)
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
