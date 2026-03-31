import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { parse } from "csv-parse/sync";
import { inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";

type CsvRow = Record<string, string | undefined>;

const ALLOWED_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const ALLOWED_TYPES = new Set(["multiple_choice", "true_false", "coding"]);

function normalizeCsvValue(value?: string): string {
  return (value || "").trim();
}

function splitList(value?: string, delimiter = ","): string[] {
  return normalizeCsvValue(value)
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickOptions(row: CsvRow): string[] {
  const directOptions = splitList(row.options, "|");
  if (directOptions.length >= 2) {
    return directOptions;
  }

  return [
    normalizeCsvValue(row.option1),
    normalizeCsvValue(row.option2),
    normalizeCsvValue(row.option3),
    normalizeCsvValue(row.option4),
  ].filter(Boolean);
}

function pickQuestion(row: CsvRow): string {
  return normalizeCsvValue(row.question || row.questionText || row.question_text);
}

function pickCorrectAnswer(row: CsvRow): string {
  return normalizeCsvValue(row.correctAnswer || row.correct_answer || row.expected_answer);
}

function shouldRequireOptions(type: string): boolean {
  return type === "multiple_choice" || type === "true_false";
}

function normalizeType(type: string, options: string[]): "multiple_choice" | "true_false" | "coding" {
  if (type === "true_false") {
    return "true_false";
  }

  if (type === "coding") {
    return "coding";
  }

  // If options are missing, treat it as an open-ended/coding style question.
  if (options.length < 2) {
    return "coding";
  }

  return "multiple_choice";
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    const csvText = await file.text();
    if (!csvText.trim()) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    const fallbackDifficulty = normalizeCsvValue(formData.get("difficulty")?.toString()).toLowerCase() || "medium";
    const fallbackType = normalizeCsvValue(formData.get("type")?.toString()).toLowerCase() || "multiple_choice";
    const fallbackCategory = normalizeCsvValue(formData.get("category")?.toString()) || "General";
    const fallbackChallengeType = normalizeCsvValue(formData.get("challengeType")?.toString());
    const fallbackPoints = Number(formData.get("points") || "10");
    const fallbackTimeAllocation = Number(formData.get("timeAllocationSeconds") || "60");

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[];

    if (!records.length) {
      return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });
    }

    const now = Date.now();
    const rowErrors: Array<{ row: number; message: string }> = [];
    const dedupeInFile = new Set<string>();
    const candidateRows: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation?: string;
      difficulty: "easy" | "medium" | "hard";
      type: "multiple_choice" | "true_false" | "coding";
      category: string;
      tags: string[];
      points: number;
      timeAllocationSeconds: number;
      rowNumber: number;
    }> = [];

    records.forEach((row, index) => {
      const rowNumber = index + 2;
      const question = pickQuestion(row);
      const options = pickOptions(row);
      const correctAnswer = pickCorrectAnswer(row);
      const explanation = normalizeCsvValue(row.explanation);

      const rowDifficulty = normalizeCsvValue(row.difficulty).toLowerCase() || fallbackDifficulty;
      const rowTypeRaw = normalizeCsvValue(row.type).toLowerCase() || fallbackType;
      const rowType = normalizeType(rowTypeRaw, options);
      const category = normalizeCsvValue(row.category) || fallbackCategory;
      const challengeType = normalizeCsvValue(row.challengeType) || fallbackChallengeType;

      const rowPointsRaw = normalizeCsvValue(row.points);
      const rowTimeRaw = normalizeCsvValue(row.timeAllocationSeconds);
      const points = rowPointsRaw ? Number(rowPointsRaw) : fallbackPoints;
      const timeAllocationSeconds = rowTimeRaw ? Number(rowTimeRaw) : fallbackTimeAllocation;

      const tags = splitList(row.tags).map((tag) => tag.toLowerCase());
      if (challengeType) {
        tags.push(`challenge:${challengeType.toLowerCase()}`);
      }

      if (!question) {
        rowErrors.push({ row: rowNumber, message: "Missing question" });
        return;
      }

      if (dedupeInFile.has(question.toLowerCase())) {
        rowErrors.push({ row: rowNumber, message: "Duplicate question text in CSV" });
        return;
      }

      if (shouldRequireOptions(rowType) && options.length < 2) {
        rowErrors.push({ row: rowNumber, message: "At least 2 options are required" });
        return;
      }

      if (!correctAnswer) {
        rowErrors.push({ row: rowNumber, message: "Missing correctAnswer" });
        return;
      }

      if (options.length > 0 && !options.includes(correctAnswer)) {
        rowErrors.push({ row: rowNumber, message: "correctAnswer must match one of the options" });
        return;
      }

      if (!ALLOWED_DIFFICULTIES.has(rowDifficulty)) {
        rowErrors.push({ row: rowNumber, message: "difficulty must be easy, medium, or hard" });
        return;
      }

      if (!ALLOWED_TYPES.has(rowTypeRaw)) {
        rowErrors.push({ row: rowNumber, message: "type must be multiple_choice, true_false, or coding" });
        return;
      }

      if (!Number.isFinite(points) || points < 1 || points > 1000) {
        rowErrors.push({ row: rowNumber, message: "points must be a number between 1 and 1000" });
        return;
      }

      if (!Number.isFinite(timeAllocationSeconds) || timeAllocationSeconds < 10 || timeAllocationSeconds > 3600) {
        rowErrors.push({ row: rowNumber, message: "timeAllocationSeconds must be between 10 and 3600" });
        return;
      }

      dedupeInFile.add(question.toLowerCase());
      candidateRows.push({
        question,
        options,
        correctAnswer,
        explanation: explanation || undefined,
        difficulty: rowDifficulty as "easy" | "medium" | "hard",
        type: rowType as "multiple_choice" | "true_false" | "coding",
        category,
        tags: Array.from(new Set(tags)),
        points,
        timeAllocationSeconds,
        rowNumber,
      });
    });

    const candidateQuestions = candidateRows.map((row) => row.question);
    const existingByQuestion = candidateQuestions.length
      ? await db
          .select({ questionText: schema.problemSet.questionText })
          .from(schema.problemSet)
          .where(inArray(schema.problemSet.questionText, candidateQuestions))
      : [];

    const existingQuestionSet = new Set(existingByQuestion.map((item) => item.questionText.toLowerCase()));
    const rowsToInsert = candidateRows.filter((row) => {
      if (!existingQuestionSet.has(row.question.toLowerCase())) {
        return true;
      }
      rowErrors.push({ row: row.rowNumber, message: "Question already exists in database" });
      return false;
    });

    if (rowsToInsert.length > 0) {
      await db.insert(schema.problemSet).values(
        rowsToInsert.map((row, index) => ({
          id: `ps_${now}_${index}_${Math.random().toString(36).slice(2, 8)}`,
          question: row.question,
          questionText: row.question,
          options: row.options,
          correctAnswer: row.correctAnswer,
          explanation: row.explanation,
          difficulty: row.difficulty,
          type: row.type,
          category: row.category,
          tags: row.tags,
          points: row.points,
          timeAllocationSeconds: row.timeAllocationSeconds,
          createdBy: session.user.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    return NextResponse.json({
      totalRows: records.length,
      created: rowsToInsert.length,
      skipped: records.length - rowsToInsert.length,
      errors: rowErrors.slice(0, 100),
      csvFormat: {
        requiredColumns: ["question", "correctAnswer"],
        optionalColumns: [
          "options (pipe-separated)",
          "option1",
          "option2",
          "option3",
          "option4",
          "explanation",
          "difficulty",
          "type",
          "category",
          "tags (comma-separated)",
          "points",
          "timeAllocationSeconds",
          "challengeType",
        ],
      },
    });
  } catch (error) {
    console.error("Error importing question CSV:", error);
    return NextResponse.json({ error: "Failed to import CSV" }, { status: 500 });
  }
}
