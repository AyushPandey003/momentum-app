import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // If BACKEND_URL is provided (local dev or custom host), use it.
    // Otherwise use a relative path so Vercel rewrites route to the serverless FastAPI in this project.
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching categories:", error);
    
    // Fallback categories if backend is not available
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 502 });
  }
}
