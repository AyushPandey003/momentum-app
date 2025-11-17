import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { task as taskTable } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { sendMail } from "@/lib/gmail"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await req.json()
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 })

    const rows = await db.query.task.findMany({
      where: and(eq(taskTable.id, taskId), eq(taskTable.userId, session.user.id)),
      limit: 1,
    })
    const t = rows[0]
    if (!t) return NextResponse.json({ error: "Task not found" }, { status: 404 })
    if (!t.managerEmail) return NextResponse.json({ error: "managerEmail not set on task" }, { status: 400 })

    const token = `tm_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`

    const updated = await db
      .update(taskTable)
      .set({ managerToken: token, managerStatus: "pending" })
      .where(and(eq(taskTable.id, taskId), eq(taskTable.userId, session.user.id)))
      .returning()

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"
    )!.replace(/\/$/, "")

    const acceptUrl = `${baseUrl}/api/tasks/accept-manager/${token}`

    const html = `
      <div>
        <h2>Mentor Request</h2>
        <p>${session.user.name || session.user.email} wants you to help manage their task: <strong>${t.title}</strong>.</p>
        <p>Click to accept: <a href="${acceptUrl}">Accept mentorship</a></p>
        <p>If you did not expect this, you can ignore this email.</p>
      </div>
    `

    try {
      await sendMail({
        to: t.managerEmail,
        subject: `Mentor request for task: ${t.title}`,
        html,
      })
    } catch (e) {
      console.error("Failed to send manager invite email", e)
      // Continue even if email fails
    }

    return NextResponse.json({ success: true, task: updated[0] })
  } catch (e) {
    console.error("manager-invite error", e)
    return NextResponse.json({ error: "Failed to send manager invite" }, { status: 500 })
  }
}


