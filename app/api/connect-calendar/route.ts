import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL is not set' }, { status: 500 });
  }
  const callbackUrl = `${baseUrl.replace(/\/$/, '')}/api/calendar/callback`;
  
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    prompt: "consent", // Force consent screen to get refresh token
  });

  console.log("🔗 Redirecting to Google OAuth for calendar connection");
  console.log("🔗 Callback URL:", callbackUrl);

  return NextResponse.redirect(authUrl);
}
