import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const body = await request.json();
    
    const response = await fetch(`${backendUrl}/quiz/skip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error skipping quiz question:", error);
    return NextResponse.json(
      { error: "Failed to skip question. Please ensure the backend service is running." },
      { status: 500 }
    );
  }
}
