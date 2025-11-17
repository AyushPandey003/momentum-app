import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;

    try {
        // Find the invitation by verification token
        const invitation = await db.query.contestInvitation.findFirst({
            where: eq(schema.contestInvitation.verificationToken, token),
            with: {
                contest: true,
                inviter: true
            }
        });

        if (!invitation) {
            return NextResponse.redirect(
                new URL("/dashboard/leaderboard?error=invalid_invitation", request.url)
            );
        }

        // Check if invitation has expired
        if (new Date() > invitation.expiresAt) {
            await db
                .update(schema.contestInvitation)
                .set({ 
                    status: "expired",
                    respondedAt: new Date()
                })
                .where(eq(schema.contestInvitation.id, invitation.id));

            return NextResponse.redirect(
                new URL("/dashboard/leaderboard?error=invitation_expired", request.url)
            );
        }

        // Check if invitation is already accepted
        if (invitation.status === "accepted") {
            return NextResponse.redirect(
                new URL("/dashboard/leaderboard?success=already_joined", request.url)
            );
        }

        // Check if invitation is declined
        if (invitation.status === "declined") {
            return NextResponse.redirect(
                new URL("/dashboard/leaderboard?error=invitation_declined", request.url)
            );
        }

        // Check if user is authenticated
        const session = await auth.api.getSession({ headers: await headers() });

        // If user doesn't exist or not authenticated, redirect to login/signup
        if (!session?.user) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("email", invitation.email);
            loginUrl.searchParams.set("contestToken", token);
            loginUrl.searchParams.set("redirect", "contest");
            return NextResponse.redirect(loginUrl);
        }

        const user = session.user;

        // Check if user's email matches invitation email  
        const userEmail = user.email?.toLowerCase().trim();
        const invitationEmail = invitation.email.toLowerCase().trim();
        
        // If emails don't match, user needs to log in with the correct email
        if (userEmail !== invitationEmail) {
            console.log("User logged in with different email than invited:", { userEmail, invitationEmail });
            // Redirect to login with the invited email pre-filled
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("email", invitation.email);
            loginUrl.searchParams.set("contestToken", token);
            loginUrl.searchParams.set("redirect", "contest");
            loginUrl.searchParams.set("message", "Please log in with the invited email address");
            return NextResponse.redirect(loginUrl);
        }

        // Verify user's email if not already verified
        if (!user.emailVerified) {
            await db
                .update(schema.user)
                .set({ emailVerified: true })
                .where(eq(schema.user.id, user.id));
        }

        // Check if user is already a participant
        const existingParticipant = await db.query.contestParticipant.findFirst({
            where: and(
                eq(schema.contestParticipant.contestId, invitation.contestId),
                eq(schema.contestParticipant.userId, user.id)
            )
        });

        if (!existingParticipant) {
            // Check if user is the contest creator
            const isCreator = invitation.contest.createdBy === user.id;
            
            // Add user as participant
            await db.insert(schema.contestParticipant).values({
                id: `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                contestId: invitation.contestId,
                userId: user.id,
                username: user.name || user.email || 'Participant',
                email: user.email || invitation.email,
                joinedAt: new Date(),
                score: 0,
                timeSpentSeconds: 0,
                status: "invited",
                isOrganizer: isCreator, // Set as organizer if they are the creator
                currentQuestionIndex: 0,
                answeredQuestions: []
            });
        } else {
            // If participant exists, ensure creator is marked as organizer
            const isCreator = invitation.contest.createdBy === user.id;
            if (isCreator && !existingParticipant.isOrganizer) {
                await db
                    .update(schema.contestParticipant)
                    .set({ isOrganizer: true })
                    .where(eq(schema.contestParticipant.id, existingParticipant.id));
            }
        }

        // Update invitation status and link to user
        await db
            .update(schema.contestInvitation)
            .set({ 
                status: "accepted",
                userId: user.id,
                respondedAt: new Date()
            })
            .where(eq(schema.contestInvitation.id, invitation.id));

        // Redirect directly to game page (lobby just redirects to game anyway)
        return NextResponse.redirect(
            new URL(`/dashboard/contest/${invitation.contestId}/game`, request.url)
        );
    } catch (error) {
        console.error("Error accepting contest invitation:", error);
        return NextResponse.redirect(
            new URL("/dashboard/leaderboard?error=something_went_wrong", request.url)
        );
    }
}
