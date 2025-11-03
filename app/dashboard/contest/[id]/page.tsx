"use client";

// DEPRECATED: This page uses old non-WebSocket contest functions
// Real-time contests now use the WebSocket service via /game page
// This page should be removed or updated to redirect to the game page

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// NOTE: These functions are removed - use WebSocket service instead
// import { getContestQuestions, submitContestAnswer, completeContestSubmission } from "@/server/contests";
import { DashboardNav } from "@/components/dashboard-nav";

// This page is deprecated and redirects to the lobby

export default function ContestPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to lobby page - this page is deprecated
    // All contest gameplay now uses WebSocket service
    toast({
      title: "Redirecting",
      description: "Use the WebSocket-based game page for contests",
    });
    router.push(`/dashboard/contest/${contestId}/lobby`);
  }, [contestId, router, toast]);

  // This page is deprecated - redirecting to lobby
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <p>Redirecting to contest lobby...</p>
        </div>
      </div>
    </div>
  );
}
