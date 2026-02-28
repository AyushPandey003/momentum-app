import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Allow unauthenticated access to contest invitation endpoints
    if (pathname.startsWith("/api/accept-contest-invitation/")) {
        return NextResponse.next();
    }

    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
        // For contest invitation links, redirect to signup with the token
        if (pathname.includes("/contest/") && pathname.includes("/lobby")) {
            const pathParts = pathname.split("/");
            const contestIdIndex = pathParts.indexOf("contest") + 1;
            const contestId = pathParts[contestIdIndex];
            
            return NextResponse.redirect(
                new URL(`/signup?redirect=contest&contestId=${contestId}`, request.url)
            );
        }
        
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/accept-contest-invitation/:path*"],
};