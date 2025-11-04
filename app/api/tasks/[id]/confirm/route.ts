import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { task as taskTable } from "@/db/schema"
import { and, eq } from "drizzle-orm"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const rows = await db.query.task.findMany({ where: eq(taskTable.id, id), limit: 1 })
    const t = rows[0]
    if (!t) return NextResponse.json({ error: "Task not found" }, { status: 404 })

    if (t.managerUserId !== session.user.id) {
      return NextResponse.json({ error: "Only assigned manager can confirm" }, { status: 403 })
    }
    if (!t.verificationImageUrl) {
      return NextResponse.json({ error: "Verification image required to confirm" }, { status: 400 })
    }

    const updated = await db
      .update(taskTable)
      .set({ managerConfirmed: true, managerConfirmedAt: new Date().toISOString() })
      .where(and(eq(taskTable.id, id), eq(taskTable.managerUserId, session.user.id)))
      .returning()

    return NextResponse.json({ success: true, task: updated[0] })
  } catch (e) {
    console.error("confirm task error", e)
    return NextResponse.json({ error: "Failed to confirm task" }, { status: 500 })
  }
}


