import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const mentorTimeoutMs = Number(process.env.MENTOR_BACKEND_TIMEOUT_MS || "30000");

  try {
    const body = await request.json();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), mentorTimeoutMs);

    let response: Response;
    try {
      response = await fetch(`${backendUrl}/mentor/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: text || `Backend responded with status ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Mentor backend request timed out.");
      return NextResponse.json(
        { error: `Mentor backend timed out after ${mentorTimeoutMs}ms` },
        { status: 504 },
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error asking AI mentor: ${message}`);

    return NextResponse.json(
      { error: "Unable to reach mentor backend" },
      { status: 502 },
    );
  }
}
