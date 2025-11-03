import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has connected Google Calendar
    const account = await db.query.account.findFirst({
      where: eq(schema.account.userId, session.user.id),
    });

    if (!account || !account.accessToken) {
      return NextResponse.json({
        connected: false,
        message: "Google Calendar not connected",
      });
    }

    // Check if token is expired
    const isExpired = account.accessTokenExpiresAt 
      ? new Date(account.accessTokenExpiresAt) < new Date() 
      : false;

    return NextResponse.json({
      connected: true,
      expired: isExpired,
      scope: account.scope,
      message: isExpired 
        ? "Calendar connected but token expired. Please reconnect." 
        : "Calendar connected successfully",
    });
  } catch (error) {
    console.error("Error checking calendar status:", error);
    return NextResponse.json(
      { error: "Failed to check calendar status" },
      { status: 500 }
    );
  }
}
