import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";

type UpdatePoolBody = {
  name?: string;
  description?: string;
  questionIds?: string[];
};

export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const poolId = context.params.id;

    const pool = await db.query.questionPool.findFirst({
      where: and(eq(schema.questionPool.id, poolId), eq(schema.questionPool.isActive, true)),
    });

    if (!pool) {
      return NextResponse.json({ error: "Question pool not found" }, { status: 404 });
    }

    const items = await db
      .select({
        problemSetId: schema.questionPoolItem.problemSetId,
        orderIndex: schema.questionPoolItem.orderIndex,
        questionText: schema.problemSet.questionText,
        difficulty: schema.problemSet.difficulty,
        category: schema.problemSet.category,
        points: schema.problemSet.points,
        timeAllocationSeconds: schema.problemSet.timeAllocationSeconds,
      })
      .from(schema.questionPoolItem)
      .innerJoin(schema.problemSet, eq(schema.problemSet.id, schema.questionPoolItem.problemSetId))
      .where(eq(schema.questionPoolItem.poolId, poolId))
      .orderBy(asc(schema.questionPoolItem.orderIndex));

    return NextResponse.json({
      pool: {
        id: pool.id,
        name: pool.name,
        description: pool.description,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
        questionIds: items.map((item) => item.problemSetId),
        questions: items,
      },
    });
  } catch (error) {
    console.error("Error loading question pool details:", error);
    return NextResponse.json({ error: "Failed to load question pool" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const poolId = context.params.id;

    const existingPool = await db.query.questionPool.findFirst({
      where: and(eq(schema.questionPool.id, poolId), eq(schema.questionPool.isActive, true)),
    });

    if (!existingPool) {
      return NextResponse.json({ error: "Question pool not found" }, { status: 404 });
    }

    const body = (await req.json()) as UpdatePoolBody;

    const updates: Partial<typeof existingPool> = {};
    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.description === "string") {
      updates.description = body.description.trim() || null;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(schema.questionPool).set(updates).where(eq(schema.questionPool.id, poolId));
    }

    if (Array.isArray(body.questionIds)) {
      const uniqueQuestionIds = Array.from(
        new Set(body.questionIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0))
      );

      if (uniqueQuestionIds.length === 0) {
        return NextResponse.json({ error: "Select at least one question" }, { status: 400 });
      }

      const existingQuestions = await db
        .select({ id: schema.problemSet.id })
        .from(schema.problemSet)
        .where(
          and(
            inArray(schema.problemSet.id, uniqueQuestionIds),
            eq(schema.problemSet.isActive, true)
          )
        );

      if (existingQuestions.length !== uniqueQuestionIds.length) {
        return NextResponse.json(
          { error: "Some selected questions are invalid or inactive" },
          { status: 400 }
        );
      }

      await db.delete(schema.questionPoolItem).where(eq(schema.questionPoolItem.poolId, poolId));

      const now = new Date();
      await db.insert(schema.questionPoolItem).values(
        uniqueQuestionIds.map((questionId, index) => ({
          id: `qpi_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
          poolId,
          problemSetId: questionId,
          orderIndex: index,
          createdAt: now,
        }))
      );

      await db
        .update(schema.questionPool)
        .set({ updatedAt: now })
        .where(eq(schema.questionPool.id, poolId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating question pool:", error);
    return NextResponse.json({ error: "Failed to update question pool" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const poolId = context.params.id;

    await db
      .update(schema.questionPool)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.questionPool.id, poolId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question pool:", error);
    return NextResponse.json({ error: "Failed to delete question pool" }, { status: 500 });
  }
}
