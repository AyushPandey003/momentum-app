"use server";

import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq, and, desc, sql, inArray, gte, lte } from "drizzle-orm";
import { sendMail } from "@/lib/gmail";
import ContestInvitationEmail from "@/components/emails/contest-invitation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createContest(data: {
    name: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    contestType?: "quick_fire" | "standard" | "marathon";
    difficulty?: "easy" | "medium" | "hard";
    category?: string;
    questionCount?: number;
    durationMinutes?: number;
    tags?: string[];
    maxParticipants?: number;
    isPrivate?: boolean;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const contestId = `contest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate dates: if startDate provided, use it; otherwise set to now (for immediate start)
    // For real-time contests, we set startDate to now and endDate based on duration
    const now = new Date();
    const startDate = data.startDate || now;
    const durationMs = (data.durationMinutes || 30) * 60 * 1000;
    const endDate = data.endDate || new Date(startDate.getTime() + durationMs);
    
    // showResultsAfter is when to reveal results (after contest ends)
    const showResultsAfter = new Date(endDate.getTime());
    
    const contest = await db.insert(schema.contest).values({
        id: contestId,
        name: data.name,
        description: data.description,
        startDate: startDate,
        endDate: endDate,
        status: "draft",
        createdBy: session.user.id,
        contestType: data.contestType || "standard",
        difficulty: data.difficulty || "medium",
        category: data.category,
        questionCount: data.questionCount || 10,
        durationMinutes: data.durationMinutes || 30,
        tags: data.tags || [],
        showResultsAfter,
        maxParticipants: data.maxParticipants || 5,
        isPrivate: data.isPrivate !== undefined ? data.isPrivate : true,
        waitingRoomActive: false,
        createdAt: now,
        updatedAt: now
    }).returning();

    // Generate questions for the contest based on filters
    await generateContestQuestions(contestId, {
        difficulty: data.difficulty || "medium",
        category: data.category,
        tags: data.tags || [],
        questionCount: data.questionCount || 10
    });

    // Automatically add creator as participant (organizer) so they can join their own contest
    await db.insert(schema.contestParticipant).values({
        id: `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contestId: contestId,
        userId: session.user.id,
        username: session.user.name || session.user.email || 'Organizer',
        email: session.user.email || '',
        joinedAt: new Date(),
        score: 0,
        timeSpentSeconds: 0,
        status: "invited",
        isOrganizer: true,
        currentQuestionIndex: 0,
        answeredQuestions: []
    });

    return contest[0];
}

export async function inviteToContest(data: {
    contestId: string;
    emails: string[];
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const contest = await db.query.contest.findFirst({
        where: eq(schema.contest.id, data.contestId)
    });

    if (!contest) {
        throw new Error("Contest not found");
    }

    // Check if user is the creator
    if (contest.createdBy !== session.user.id) {
        throw new Error("Only contest creator can send invitations");
    }

    // Validate max participants (including organizer)
    const existingParticipants = await db.query.contestParticipant.findMany({
        where: eq(schema.contestParticipant.contestId, data.contestId)
    });

    const totalParticipants = existingParticipants.length + data.emails.length;
    if (totalParticipants > contest.maxParticipants) {
        throw new Error(`Maximum ${contest.maxParticipants} participants allowed (including organizer)`);
    }

    const invitations = [];

    for (const email of data.emails) {
        const invitationId = `ci_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const verificationToken = `ct_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const invitation = await db.insert(schema.contestInvitation).values({
            id: invitationId,
            contestId: data.contestId,
            email,
            status: "pending",
            invitedBy: session.user.id,
            invitedAt: new Date(),
            expiresAt,
            verificationToken,
            emailSent: false
        }).returning();

        // Send email
        // Get base URL from environment, removing any trailing slash
        const baseUrl = (
            process.env.NEXT_PUBLIC_APP_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
            "http://localhost:3000"
        ).replace(/\/$/, '');
        
        const verifyAndJoinUrl = `${baseUrl}/api/accept-contest-invitation/${verificationToken}`;
        
        const { renderToStaticMarkup } = await import("react-dom/server");
        const html = renderToStaticMarkup(
            ContestInvitationEmail({
                email,
                invitedByUsername: session.user.name,
                invitedByEmail: session.user.email,
                contestName: contest.name,
                contestDescription: contest.description || undefined,
                startDate: contest.startDate?.toLocaleDateString() || 'To be decided',
                endDate: contest.endDate?.toLocaleDateString() || 'To be decided',
                verifyAndJoinUrl
            })
        );

        try {
            await sendMail({
                from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
                to: email,
                subject: `You're invited to join ${contest.name}`,
                html
            });

            // Mark email as sent
            await db
                .update(schema.contestInvitation)
                .set({ 
                    emailSent: true, 
                    emailSentAt: new Date() 
                })
                .where(eq(schema.contestInvitation.id, invitationId));
        } catch (emailError) {
            console.error(`Failed to send email to ${email}:`, emailError);
            // Continue even if email fails - invitation is still created
        }

        invitations.push(invitation[0]);
    }

    return invitations;
}

export async function getActiveContests() {
    const now = new Date();
    
    const contests = await db.query.contest.findMany({
        where: and(
            eq(schema.contest.status, "in_progress")
        ),
        with: {
            participants: {
                with: {
                    user: true
                },
                orderBy: desc(schema.contestParticipant.score)
            },
            creator: true
        },
        orderBy: desc(schema.contest.startDate)
    });

    // Filter out contests that have passed their end date
    return contests.filter(contest => {
        if (!contest.endDate) return true;
        return new Date(contest.endDate) >= now;
    });
}

export async function getContestById(contestId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const contest = await db.query.contest.findFirst({
        where: eq(schema.contest.id, contestId),
        with: {
            participants: {
                with: {
                    user: true
                },
                orderBy: desc(schema.contestParticipant.score)
            },
            creator: true,
            invitations: true
        }
    });

    if (!contest) {
        throw new Error("Contest not found");
    }

    // Check if current user is a participant or creator
    const isParticipant = contest.participants.some(p => p.userId === session.user.id);
    const isCreator = contest.createdBy === session.user.id;

    if (!isParticipant && !isCreator) {
        throw new Error("You are not authorized to view this contest");
    }

    return contest;
}

export async function getUserContests(userId: string) {
    const now = new Date();
    
    // Get contests where user is a participant
    const participations = await db.query.contestParticipant.findMany({
        where: eq(schema.contestParticipant.userId, userId),
        with: {
            contest: {
                with: {
                    creator: true
                }
            }
        },
        orderBy: desc(schema.contestParticipant.joinedAt)
    });

    // Get contests where user is the creator
    const createdContests = await db.query.contest.findMany({
        where: eq(schema.contest.createdBy, userId),
        with: {
            creator: true
        },
        orderBy: desc(schema.contest.createdAt)
    });

    // Combine and deduplicate, excluding expired/finished contests.
    const isActiveContest = (c: any) => {
        if (!c) return false;
        // Exclude explicit finished status
        if (c.status === "finished") return false;
        // Use actualEndTime if present (organizer-ended), otherwise fall back to endDate
        const endTime = c.actualEndTime || c.endDate;
        if (endTime) {
            const end = (endTime instanceof Date) ? endTime : new Date(endTime);
            if (end.getTime() < now.getTime() && c.status !== "draft") return false;
        }
        return true;
    };

    const allContests = [
        ...participations.map(p => p.contest).filter(isActiveContest),
        ...createdContests.filter(isActiveContest)
    ];

    // Remove duplicates by ID
    const uniqueContests = allContests.filter((contest, index, self) =>
        index === self.findIndex((c) => c.id === contest.id)
    );

    // Sort by date (newest first)
    uniqueContests.sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return uniqueContests;
}

export async function getCompletedContests(userId: string) {
    const now = new Date();

    // Robust DB-level queries to fetch contests that are finished or whose end time has passed.
    // This avoids relying on client-side filtering which can miss contests due to serialization.

    // Fetch participant rows and map their contests; make the completed check resilient.
    const participations = await db.query.contestParticipant.findMany({
        where: eq(schema.contestParticipant.userId, userId),
        with: {
            contest: {
                with: {
                    creator: true
                }
            }
        }
    });

    const createdContests = await db.query.contest.findMany({
        where: eq(schema.contest.createdBy, userId),
        with: {
            creator: true
        }
    });

    // Helper to determine if a contest is completed/expired
    const isCompleted = (c: any) => {
        try {
            if (!c) return false;
            if (c.status === "finished") return true;
            // consider actualEndTime as authoritative if present
            const endTime = c.actualEndTime || c.endDate;
            if (!endTime) return false;
            const end = (endTime instanceof Date) ? endTime : new Date(endTime);
            return end.getTime() < now.getTime();
        } catch (e) {
            return false;
        }
    };

    const allContests = [
        ...participations.map(p => p.contest).filter(isCompleted),
        ...createdContests.filter(isCompleted)
    ];

    // Deduplicate
    const uniqueContests = allContests.filter((contest, index, self) =>
        index === self.findIndex((c) => c.id === contest.id)
    );

    // Sort by end time (most recent first). Use actualEndTime or endDate.
    uniqueContests.sort((a, b) => {
        const getEnd = (c: any) => {
            const t = c.actualEndTime || c.endDate || c.createdAt || new Date(0);
            return (t instanceof Date) ? t.getTime() : new Date(t).getTime();
        };
        return getEnd(b) - getEnd(a);
    });

    return uniqueContests;
}

export async function getInvitedContests(userEmail: string) {
    // Get pending invitations for the user's email
    const invitations = await db.query.contestInvitation.findMany({
        where: and(
            eq(schema.contestInvitation.email, userEmail),
            eq(schema.contestInvitation.status, "pending")
        ),
        with: {
            contest: {
                with: {
                    creator: true
                }
            },
            inviter: true
        },
        orderBy: desc(schema.contestInvitation.invitedAt)
    });

    // Filter out expired invitations and return contests
    const now = new Date();
    return invitations
        .filter(inv => new Date(inv.expiresAt) > now)
        .map(inv => ({
            ...inv.contest,
            invitationToken: inv.verificationToken,
            invitedBy: inv.inviter,
            invitedAt: inv.invitedAt
        }));
}


// Note: Contest status updates, waiting room, and game start are now handled by the WebSocket service

// Problem Set Management
export async function createProblemSet(data: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty: "easy" | "medium" | "hard";
    type: "multiple_choice" | "true_false" | "coding";
    category: string;
    tags?: string[];
    points?: number;
    timeAllocationSeconds?: number;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const problemSetId = `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const problemSet = await db.insert(schema.problemSet).values({
        id: problemSetId,
        question: data.question,
        questionText: data.question, // Alias for compatibility
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        difficulty: data.difficulty,
        type: data.type,
        category: data.category,
        tags: data.tags || [],
        points: data.points || 10,
        timeAllocationSeconds: data.timeAllocationSeconds || 60,
        createdBy: session.user.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }).returning();

    return problemSet[0];
}

export async function getProblemSets(filters?: {
    difficulty?: "easy" | "medium" | "hard";
    category?: string;
    tags?: string[];
    isActive?: boolean;
}) {
    let conditions = [];
    
    if (filters?.difficulty) {
        conditions.push(eq(schema.problemSet.difficulty, filters.difficulty));
    }
    
    if (filters?.category) {
        conditions.push(eq(schema.problemSet.category, filters.category));
    }
    
    if (filters?.isActive !== undefined) {
        conditions.push(eq(schema.problemSet.isActive, filters.isActive));
    }

    const problemSets = await db.query.problemSet.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(schema.problemSet.createdAt)
    });

    return problemSets;
}

// Generate questions for contest based on filters
async function generateContestQuestions(
    contestId: string,
    filters: {
        difficulty: "easy" | "medium" | "hard";
        category?: string;
        tags: string[];
        questionCount: number;
    }
) {
    let conditions = [
        eq(schema.problemSet.difficulty, filters.difficulty),
        eq(schema.problemSet.isActive, true)
    ];
    
    if (filters.category) {
        conditions.push(eq(schema.problemSet.category, filters.category));
    }

    // Get all matching problem sets
    const problemSets = await db.query.problemSet.findMany({
        where: and(...conditions)
    });

    // Filter by tags if specified
    let filteredProblems = problemSets;
    if (filters.tags.length > 0) {
        filteredProblems = problemSets.filter(ps => 
            ps.tags.some(tag => filters.tags.includes(tag))
        );
    }

    // If we don't have enough problems, use all available
    if (filteredProblems.length < filters.questionCount) {
        filteredProblems = problemSets;
    }

    // Randomly select questions
    const shuffled = filteredProblems.sort(() => 0.5 - Math.random());
    const selectedProblems = shuffled.slice(0, Math.min(filters.questionCount, shuffled.length));

    // Insert contest questions
    for (let i = 0; i < selectedProblems.length; i++) {
        const questionId = `cq_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(schema.contestQuestion).values({
            id: questionId,
            contestId,
            problemSetId: selectedProblems[i].id,
            orderIndex: i
        });
    }

    return selectedProblems.length;
}

// Note: Contest questions and answer submission are now handled by the WebSocket service
// Use the WebSocket service for real-time gameplay

// Get contest leaderboard
export async function getContestLeaderboard(contestId: string) {
    // First, get contest info to determine status
    const contest = await db.query.contest.findFirst({
        where: eq(schema.contest.id, contestId)
    });

    if (!contest) {
        throw new Error("Contest not found");
    }

    // Show results if contest is finished OR if showResultsAfter time has passed
    const shouldShowResults = 
        contest.status === "finished" ||
        (contest.showResultsAfter && new Date() > contest.showResultsAfter);

    let sortedParticipants: any[] = [];
    let submissionsByUser: Record<string, { total: number; correct: number }> = {};

    // For finished contests, use contest_result table (final results)
    // If no results exist yet, fallback to contest_participant
    if (contest.status === "finished") {
        // Try to get results from contest_result first
        const results = await db
            .select({
                userId: schema.contestResult.userId,
                userName: schema.user.name,
                userImage: schema.user.image,
                score: schema.contestResult.score,
                rank: schema.contestResult.rank,
                completedAt: schema.contestResult.completedAt,
            })
            .from(schema.contestResult)
            .leftJoin(schema.user, eq(schema.contestResult.userId, schema.user.id))
            .where(eq(schema.contestResult.contestId, contestId))
            .orderBy(schema.contestResult.rank);

        // If no results in contest_result, use contest_participant as fallback
        if (results.length === 0) {
            const participants = await db
                .select({
                    userId: schema.contestParticipant.userId,
                    score: schema.contestParticipant.score,
                    userName: schema.user.name,
                    userImage: schema.user.image,
                    submittedAt: schema.contestParticipant.submittedAt,
                })
                .from(schema.contestParticipant)
                .leftJoin(schema.user, eq(schema.contestParticipant.userId, schema.user.id))
                .where(eq(schema.contestParticipant.contestId, contestId));

            // Sort by score and assign ranks
            const sorted = participants.sort((a, b) => b.score - a.score);
            sortedParticipants = sorted.map((p, index) => ({
                userId: p.userId,
                userName: p.userName,
                userImage: p.userImage,
                score: p.score,
                rank: index + 1,
                submittedAt: p.submittedAt,
                timeSpentSeconds: 0, // Will be filled from participant stats
            }));
        } else {
            // Get submissions for submission counts
            const participantSubmissions = await db
                .select({
                    userId: schema.contestSubmission.userId,
                    isCorrect: schema.contestSubmission.isCorrect,
                })
                .from(schema.contestSubmission)
                .where(eq(schema.contestSubmission.contestId, contestId));

            // Also fetch participant runtime stats (timeSpentSeconds) if available
            const participantRows = await db
                .select({ userId: schema.contestParticipant.userId, timeSpentSeconds: schema.contestParticipant.timeSpentSeconds })
                .from(schema.contestParticipant)
                .where(eq(schema.contestParticipant.contestId, contestId));

            const participantStatsByUser = participantRows.reduce((acc, p) => {
                acc[p.userId] = { timeSpentSeconds: p.timeSpentSeconds || 0 };
                return acc;
            }, {} as Record<string, { timeSpentSeconds: number }> );

            // Group submissions by userId
            submissionsByUser = participantSubmissions.reduce((acc, sub) => {
                if (!acc[sub.userId]) {
                    acc[sub.userId] = { total: 0, correct: 0 };
                }
                acc[sub.userId].total += 1;
                if (sub.isCorrect) {
                    acc[sub.userId].correct += 1;
                }
                return acc;
            }, {} as Record<string, { total: number; correct: number }>);

            sortedParticipants = results.map(r => ({
                userId: r.userId,
                userName: r.userName,
                userImage: r.userImage,
                score: r.score,
                rank: r.rank,
                submittedAt: r.completedAt,
                timeSpentSeconds: participantStatsByUser[r.userId]?.timeSpentSeconds ?? 0,
            }));
        }
    } else {
        // For in-progress or draft contests, use contest_participant table
        const participants = await db
            .select({
                id: schema.contestParticipant.id,
                userId: schema.contestParticipant.userId,
                score: schema.contestParticipant.score,
                timeSpentSeconds: schema.contestParticipant.timeSpentSeconds,
                submittedAt: schema.contestParticipant.submittedAt,
                userName: schema.user.name,
                userImage: schema.user.image,
            })
            .from(schema.contestParticipant)
            .leftJoin(schema.user, eq(schema.contestParticipant.userId, schema.user.id))
            .where(eq(schema.contestParticipant.contestId, contestId));

        // Get submissions for each participant
        const participantSubmissions = await db
            .select({
                userId: schema.contestSubmission.userId,
                isCorrect: schema.contestSubmission.isCorrect,
            })
            .from(schema.contestSubmission)
            .where(eq(schema.contestSubmission.contestId, contestId));

        // Group submissions by userId
        submissionsByUser = participantSubmissions.reduce((acc, sub) => {
            if (!acc[sub.userId]) {
                acc[sub.userId] = { total: 0, correct: 0 };
            }
            acc[sub.userId].total += 1;
            if (sub.isCorrect) {
                acc[sub.userId].correct += 1;
            }
            return acc;
        }, {} as Record<string, { total: number; correct: number }>);

        // Sort by score desc, then by time spent asc
        sortedParticipants = participants.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.timeSpentSeconds - b.timeSpentSeconds;
        });
    }

    return {
        contest: {
            id: contest.id,
            name: contest.name,
            description: contest.description,
            status: contest.status,
            showResultsAfter: contest.showResultsAfter,
            shouldShowResults
        },
        leaderboard: sortedParticipants.map((p, index) => ({
            rank: p.rank || index + 1,
            userId: p.userId,
            userName: p.userName,
            userImage: p.userImage,
            score: shouldShowResults ? p.score : null,
            timeSpentSeconds: shouldShowResults ? p.timeSpentSeconds : null,
            submittedAt: p.submittedAt,
            totalSubmissions: submissionsByUser[p.userId]?.total || 0,
            correctSubmissions: shouldShowResults ? (submissionsByUser[p.userId]?.correct || 0) : null
        }))
    };
}

// Note: Participant score updates are handled by the WebSocket service

// Delete a contest (only creator can delete)
export async function deleteContest(contestId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const contest = await db.query.contest.findFirst({
        where: eq(schema.contest.id, contestId)
    });

    if (!contest) {
        throw new Error("Contest not found");
    }

    // Check if user is the creator
    if (contest.createdBy !== session.user.id) {
        throw new Error("Only contest creator can delete the contest");
    }

    // Don't allow deleting contests that are in progress
    if (contest.status === "in_progress") {
        throw new Error("Cannot delete a contest that is in progress");
    }

    // If this is a real-time contest (contestType === "quick_fire"), 
    // we need to notify the Go WebSocket service to shut down the hub
    if (contest.contestType === "quick_fire") {
        try {
            const GO_SERVICE_URL = process.env.GO_WEBSOCKET_SERVICE_URL || "http://localhost:8080";
            
            // Get JWT token for Go service authentication
            const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/contest/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ contestId }),
            });

            if (tokenResponse.ok) {
                const { token } = await tokenResponse.json();
                
                // Call Go service to delete the contest hub
                const goResponse = await fetch(`${GO_SERVICE_URL}/api/contests/${contestId}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!goResponse.ok) {
                    console.error(`Failed to delete contest ${contestId} from Go service: ${goResponse.status}`);
                    // Continue with DB deletion even if Go service fails
                }
            }
        } catch (error) {
            console.error("Error notifying Go service about contest deletion:", error);
            // Continue with DB deletion even if Go service notification fails
        }
    }

    // Delete from database
    await db.delete(schema.contest).where(eq(schema.contest.id, contestId));

    return { success: true };
}
