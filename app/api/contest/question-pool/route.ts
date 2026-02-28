import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { isContestAdminUser } from "@/lib/contest-admin";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isContestAdminUser(session.user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = req.nextUrl.searchParams;
    const search = params.get("search")?.trim();
    const difficulty = params.get("difficulty")?.trim();
    const category = params.get("category")?.trim();
    const limit = Math.min(Number(params.get("limit") || 80), 200);

    const conditions = [eq(schema.problemSet.isActive, true)];

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      conditions.push(eq(schema.problemSet.difficulty, difficulty as "easy" | "medium" | "hard"));
    }

    if (category && category !== "all") {
      conditions.push(eq(schema.problemSet.category, category));
    }

    if (search) {
      conditions.push(
        sql`(
          ${schema.problemSet.questionText} ILIKE ${`%${search}%`}
          OR ${schema.problemSet.category} ILIKE ${`%${search}%`}
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(${schema.problemSet.tags}) AS tag
            WHERE tag ILIKE ${`%${search}%`}
          )
        )`
      );
    }

    const [questions, categoryRows] = await Promise.all([
      db
        .select({
          id: schema.problemSet.id,
          questionText: schema.problemSet.questionText,
          difficulty: schema.problemSet.difficulty,
          category: schema.problemSet.category,
          tags: schema.problemSet.tags,
          points: schema.problemSet.points,
          timeAllocationSeconds: schema.problemSet.timeAllocationSeconds,
          createdAt: schema.problemSet.createdAt,
        })
        .from(schema.problemSet)
        .where(and(...conditions))
        .orderBy(desc(schema.problemSet.createdAt))
        .limit(limit),
      db
        .selectDistinct({ category: schema.problemSet.category })
        .from(schema.problemSet)
        .where(eq(schema.problemSet.isActive, true))
        .orderBy(schema.problemSet.category),
    ]);

    return NextResponse.json({
      questions,
      categories: categoryRows.map((row) => row.category).filter(Boolean),
      isAdmin: true,
    });
  } catch (error) {
    console.error("Error loading question pool:", error);
    return NextResponse.json({ error: "Failed to load question pool" }, { status: 500 });
  }
}
