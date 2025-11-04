import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { task as taskTable, user as userTable } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    const rows = await db.query.task.findMany({ where: eq(taskTable.managerToken, token), limit: 1 })
    const t = rows[0]
    if (!t) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 })
    }

    if (!session?.user) {
      // redirect to login with redirect back
      const url = new URL("/login", req.url)
      url.searchParams.set("redirect", `/api/tasks/accept-manager/${token}`)
      return NextResponse.redirect(url)
    }

    // Require the accepting user's email to match the invited manager (case-insensitive)
    let sessionEmail = session.user.email
    if (!sessionEmail) {
      const u = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
      sessionEmail = u?.email || undefined
    }
    const invitedEmail = t.managerEmail?.trim().toLowerCase()
    const currentEmail = sessionEmail?.trim().toLowerCase()
    if (!invitedEmail || !currentEmail || invitedEmail !== currentEmail) {
      return NextResponse.json({ error: "This invite is not for your account" }, { status: 403 })
    }

    await db
      .update(taskTable)
      .set({ managerStatus: "accepted", managerUserId: session.user.id })
      .where(eq(taskTable.id, t.id))

    // Redirect to tasks page with success
    const base = new URL("/dashboard/tasks?success=manager_accepted", req.url)
    return NextResponse.redirect(base)
  } catch (e) {
    console.error("accept-manager error", e)
    return NextResponse.json({ error: "Failed to accept manager invite" }, { status: 500 })
  }
}


