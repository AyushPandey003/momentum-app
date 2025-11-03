import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * API Route: Login to Go Contest Service
 * 
 * This endpoint handles authentication with the Go WebSocket service.
 * It returns a JWT token that can be used for WebSocket connections.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contestId } = await req.json();

    if (!contestId) {
      return NextResponse.json(
        { error: "Contest ID is required" },
        { status: 400 }
      );
    }

    // Get the Go service URL from environment
    const GO_SERVICE_URL = process.env.GO_WEBSOCKET_SERVICE_URL || "http://localhost:8080";

    // Login to Go service
    const goResponse = await fetch(`${GO_SERVICE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: session.user.name || session.user.email,
        password: "dummy", // Go service accepts any password for now
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

    // Return the token
    return NextResponse.json({
      token: loginData.token,
      userId: loginData.user_id,
      username: loginData.username,
      expiresAt: loginData.expires_at,
    });
  } catch (error) {
    console.error("Error logging into Go service:", error);
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 }
    );
  }
}
