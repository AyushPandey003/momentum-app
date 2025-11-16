import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * API Route: Generate JWT Token for Go WebSocket Service
 * 
 * This endpoint generates a JWT token for authenticating with the Go WebSocket service.
 * The token is used when connecting to WebSocket endpoints.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contestId } = await req.json();

    if (!contestId) {
      return NextResponse.json({ error: "Contest ID is required" }, { status: 400 });
    }

    // Get the Go service URL from environment
    const GO_SERVICE_URL = process.env.GO_WEBSOCKET_SERVICE_URL ;

    // Login to Go service to get JWT token
    // Pass the real user ID and info from the session
    const goResponse = await fetch(`${GO_SERVICE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: session.user.name || session.user.email || session.user.id,
        password: "dummy", // Go service accepts any password for now
        user_id: session.user.id, // Pass the real user ID from Next.js session
      }),
    });

    if (!goResponse.ok) {
      const errorText = await goResponse.text();
      console.error("Go service login error:", errorText);
      return NextResponse.json(
        { error: "Failed to authenticate with contest service" },
        { status: goResponse.status }
      );
    }

    const loginData = await goResponse.json();

    return NextResponse.json({ 
      token: loginData.token,
      userId: loginData.user_id,
      username: loginData.username,
    });
  } catch (error) {
    console.error("Error generating contest token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
