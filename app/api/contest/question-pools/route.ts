import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

type CreatePoolBody = {
  name?: string;
  description?: string;
  questionIds?: string[];
};

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pools = await db
      .select({
        id: schema.questionPool.id,
        name: schema.questionPool.name,
        description: schema.questionPool.description,
        createdBy: schema.questionPool.createdBy,
        createdAt: schema.questionPool.createdAt,
        updatedAt: schema.questionPool.updatedAt,
        questionCount: sql<number>`count(${schema.questionPoolItem.id})`,
      })
      .from(schema.questionPool)
      .leftJoin(schema.questionPoolItem, eq(schema.questionPoolItem.poolId, schema.questionPool.id))
      .where(eq(schema.questionPool.isActive, true))
      .groupBy(schema.questionPool.id)
      .orderBy(desc(schema.questionPool.updatedAt));

    return NextResponse.json({ pools });
  } catch (error) {
    console.error("Error listing question pools:", error);
    return NextResponse.json({ error: "Failed to load question pools" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreatePoolBody;
    const name = body.name?.trim();
    const description = body.description?.trim() || null;
    const rawIds = Array.isArray(body.questionIds) ? body.questionIds : [];
    const uniqueQuestionIds = Array.from(
      new Set(rawIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0))
    );

    if (!name) {
      return NextResponse.json({ error: "Pool name is required" }, { status: 400 });
    }

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

    const now = new Date();
    const poolId = `qp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.insert(schema.questionPool).values({
      id: poolId,
      name,
      description,
      createdBy: session.user.id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schema.questionPoolItem).values(
      uniqueQuestionIds.map((questionId, index) => ({
        id: `qpi_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
        poolId,
        problemSetId: questionId,
        orderIndex: index,
        createdAt: now,
      }))
    );

    return NextResponse.json({
      pool: {
        id: poolId,
        name,
        description,
        questionCount: uniqueQuestionIds.length,
      },
    });
  } catch (error) {
    console.error("Error creating question pool:", error);
    return NextResponse.json({ error: "Failed to create question pool" }, { status: 500 });
  }
}
