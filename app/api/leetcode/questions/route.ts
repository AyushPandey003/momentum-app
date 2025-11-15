import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

interface LeetCodeQuestion {
  title: string;
  titleSlug: string;
  difficulty: string;
  acRate: string;
  paidOnly: string;
  status: string;
  topicTags: string;
  url: string;
}

// Cache for parsed questions
let cachedQuestions: LeetCodeQuestion[] | null = null;

function loadLeetCodeQuestions(): LeetCodeQuestion[] {
  if (cachedQuestions) {
    return cachedQuestions;
  }

  const csvPath = path.join(process.cwd(), "resource", "leetcode_all.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as LeetCodeQuestion[];

  cachedQuestions = records;
  return records;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const difficulty = searchParams.get("difficulty"); // "Easy", "Medium", "Hard"
    const topicTag = searchParams.get("topic"); // filter by topic tag

    const allQuestions = loadLeetCodeQuestions();
    
    // Filter out paid-only questions
    let filteredQuestions = allQuestions.filter(q => q.paidOnly !== "True");

    // Apply difficulty filter
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(
        q => q.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    // Apply topic filter
    if (topicTag) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.topicTags.toLowerCase().includes(topicTag.toLowerCase())
      );
    }

    // Get a random question
    if (filteredQuestions.length === 0) {
      return NextResponse.json({ error: "No questions found matching criteria" }, { status: 404 });
    }

    const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];

    return NextResponse.json(randomQuestion);
  } catch (error) {
    console.error("Error fetching LeetCode question:", error);
    return NextResponse.json(
      { error: "Failed to fetch LeetCode question" },
      { status: 500 }
    );
  }
}

// Get available topics
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allQuestions = loadLeetCodeQuestions();
    
    // Extract unique topic tags
    const topicsSet = new Set<string>();
    
    allQuestions.forEach(q => {
      if (q.topicTags) {
        const tags = q.topicTags.split(';');
        tags.forEach(tag => {
          if (tag.trim()) {
            topicsSet.add(tag.trim());
          }
        });
      }
    });

    const topics = Array.from(topicsSet).sort();

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
