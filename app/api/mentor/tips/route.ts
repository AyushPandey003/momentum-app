import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const { searchParams } = new URL(request.url);
    const count = searchParams.get("count") || "5";
    
    const response = await fetch(
      `${backendUrl}/backend/mentor/tips?count=${count}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching mentor tips:", error);
    return NextResponse.json(
      { error: "Failed to fetch tips. Please ensure the backend service is running." },
      { status: 500 }
    );
  }
}
