"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { useToast } from "@/hooks/use-toast";

/**
 * Contest Lobby Page
 * 
 * This page redirects to the WebSocket-based game page.
 * All contest lobby and gameplay functionality is handled by the WebSocket service.
 */
export default function ContestLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const { toast } = useToast();

  useEffect(() => {
    // Redirect directly to the game page - WebSocket handles all lobby functionality
    toast({
      title: "Joining Contest",
      description: "Connecting to contest lobby...",
    });
    router.push(`/dashboard/contest/${contestId}/game`);
  }, [contestId, router, toast]);

  // This page now just redirects - all lobby functionality is in the game page
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center">
          <p>Redirecting to contest lobby...</p>
        </div>
      </div>
    </div>
  );
}
