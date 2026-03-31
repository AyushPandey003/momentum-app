import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const difficulty = params.get("difficulty")?.trim();
    const category = params.get("category")?.trim();
    const limit = Math.min(Number(params.get("limit") || 20), 50);

    const conditions = [eq(schema.problemSet.isActive, true)];

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      conditions.push(
        eq(schema.problemSet.difficulty, difficulty as "easy" | "medium" | "hard")
      );
    }

    if (category && category !== "all") {
      conditions.push(eq(schema.problemSet.category, category));
    }

    const [questions, categoryRows, countRows] = await Promise.all([
      db
        .select({
          id: schema.problemSet.id,
          questionText: schema.problemSet.questionText,
          options: schema.problemSet.options,
          correctAnswer: schema.problemSet.correctAnswer,
          explanation: schema.problemSet.explanation,
          difficulty: schema.problemSet.difficulty,
          category: schema.problemSet.category,
          tags: schema.problemSet.tags,
          points: schema.problemSet.points,
          timeAllocationSeconds: schema.problemSet.timeAllocationSeconds,
        })
        .from(schema.problemSet)
        .where(and(...conditions))
        .orderBy(sql`RANDOM()`)
        .limit(limit),
      db
        .selectDistinct({ category: schema.problemSet.category })
        .from(schema.problemSet)
        .where(eq(schema.problemSet.isActive, true))
        .orderBy(schema.problemSet.category),
      db
        .select({
          difficulty: schema.problemSet.difficulty,
          category: schema.problemSet.category,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.problemSet)
        .where(eq(schema.problemSet.isActive, true))
        .groupBy(schema.problemSet.difficulty, schema.problemSet.category),
    ]);

    return NextResponse.json({
      questions,
      categories: categoryRows.map((row) => row.category).filter(Boolean),
      counts: countRows,
    });
  } catch (error) {
    console.error("Error loading practice questions:", error);
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 }
    );
  }
}
