import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db/drizzle"
import { task } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tasks = await db.query.task.findMany({
      where: eq(task.managerUserId, session.user.id),
    })

    return NextResponse.json({ tasks })
  } catch (e) {
    console.error("manager/tasks GET error", e)
    return NextResponse.json({ error: "Failed to fetch managed tasks" }, { status: 500 })
  }
}


