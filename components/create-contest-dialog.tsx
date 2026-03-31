"use client";

import { useCallback, useEffect, useMemo, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Send, Search, ShieldCheck, Loader2, CheckSquare, Square, RefreshCw, Sparkles, ListChecks, Timer, Users2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface CreateContestDialogProps {
  children?: ReactNode;
  onSuccess?: () => void;
  userContestCount?: number;
}

interface QuestionPoolItem {
  id: string;
  questionText: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  tags: string[];
  points: number;
  timeAllocationSeconds: number;
}

interface NamedQuestionPool {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
}

export function CreateContestDialog({ children, onSuccess, userContestCount = 0 }: CreateContestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contestName, setContestName] = useState("");
  const [description, setDescription] = useState("");
  const [startDateTime, setStartDateTime] = useState<Date>(new Date());
  const [emails, setEmails] = useState<string[]>([""]);

  const [contestType, setContestType] = useState<"quick_fire" | "standard" | "marathon">("standard");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [category, setCategory] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [tags, setTags] = useState<string>("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [poolSearch, setPoolSearch] = useState("");
  const [poolDifficulty, setPoolDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [poolCategory, setPoolCategory] = useState<string>("all");
  const [poolCategories, setPoolCategories] = useState<string[]>([]);
  const [questionPool, setQuestionPool] = useState<QuestionPoolItem[]>([]);
  const [namedPools, setNamedPools] = useState<NamedQuestionPool[]>([]);
  const [namedPoolsLoading, setNamedPoolsLoading] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string>("none");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [useQuestionPool, setUseQuestionPool] = useState(true);

  const { toast } = useToast();
  const isLimitReached = userContestCount >= 2;

  const selectedQuestionCount = selectedQuestionIds.length;
  const effectiveQuestionCount = useQuestionPool && selectedQuestionCount > 0 ? selectedQuestionCount : questionCount;

  const selectedQuestionMap = useMemo(() => {
    const map = new Map<string, QuestionPoolItem>();
    for (const question of questionPool) {
      map.set(question.id, question);
    }
    return map;
  }, [questionPool]);

  const selectedSummary = useMemo(() => {
    let points = 0;
    let totalTimeSeconds = 0;
    for (const id of selectedQuestionIds) {
      const question = selectedQuestionMap.get(id);
      if (question) {
        points += question.points || 0;
        totalTimeSeconds += question.timeAllocationSeconds || 0;
      }
    }
    return {
      points,
      totalMinutes: Math.ceil(totalTimeSeconds / 60),
    };
  }, [selectedQuestionIds, selectedQuestionMap]);

  const handleAddEmail = () => {
    setEmails((prev) => [...prev, ""]);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    setEmails((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const toggleQuestionSelection = (questionId: string, checked: boolean) => {
    setSelectedQuestionIds((prev) => {
      if (checked) {
        if (prev.includes(questionId)) return prev;
        return [...prev, questionId];
      }
      return prev.filter((id) => id !== questionId);
    });
  };

  const loadQuestionPool = useCallback(async (signal?: AbortSignal) => {
    try {
      setPoolLoading(true);
      setPoolError(null);

      const params = new URLSearchParams();
      if (poolSearch.trim()) params.set("search", poolSearch.trim());
      if (poolDifficulty !== "all") params.set("difficulty", poolDifficulty);
      if (poolCategory !== "all") params.set("category", poolCategory);
      params.set("limit", "120");

      const response = await fetch(`/api/contest/question-pool?${params.toString()}`, { signal });

      if (!response.ok) {
        throw new Error("Unable to load question pool");
      }

      const data = await response.json();
      setIsAdmin(Boolean(data.isAdmin));
      setQuestionPool(Array.isArray(data.questions) ? data.questions : []);
      setPoolCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setPoolError("Failed to load question pool. Please retry.");
    } finally {
      setPoolLoading(false);
    }
  }, [poolSearch, poolDifficulty, poolCategory]);

  const loadNamedPools = useCallback(async (signal?: AbortSignal) => {
    try {
      setNamedPoolsLoading(true);

      const response = await fetch("/api/contest/question-pools", { signal });
      if (!response.ok) {
        throw new Error("Unable to load saved pools");
      }

      const data = await response.json();
      setNamedPools(Array.isArray(data.pools) ? data.pools : []);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(error);
    } finally {
      setNamedPoolsLoading(false);
    }
  }, []);

  const applyNamedPool = useCallback(async (poolId: string) => {
    if (!poolId || poolId === "none") {
      setSelectedQuestionIds([]);
      return;
    }

    try {
      const response = await fetch(`/api/contest/question-pools/${poolId}`);
      if (!response.ok) {
        throw new Error("Unable to load pool details");
      }

      const data = await response.json();
      const ids = Array.isArray(data?.pool?.questionIds) ? data.pool.questionIds : [];
      setSelectedQuestionIds(ids);

      if (ids.length > 0) {
        toast({
          title: "Pool applied",
          description: `Loaded ${ids.length} question(s) from selected pool.`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to apply pool",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadQuestionPool(controller.signal);
      loadNamedPools(controller.signal);
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, loadQuestionPool, loadNamedPools]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contestName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a contest name",
        variant: "destructive",
      });
      return;
    }

    if (useQuestionPool && selectedQuestionIds.length === 0) {
      toast({
        title: "No Questions Selected",
        description: "Select at least one question from the pool for curated mode.",
        variant: "destructive",
      });
      return;
    }

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

    if (endDateTime <= startDateTime) {
      toast({
        title: "Invalid Date/Time",
        description: "Duration must be positive",
        variant: "destructive",
      });
      return;
    }

    if (!(useQuestionPool && selectedQuestionIds.length > 0) && (questionCount < 10 || questionCount > 50)) {
      toast({
        title: "Invalid Question Count",
        description: "Question count must be between 10 and 50",
        variant: "destructive",
      });
      return;
    }

    if (durationMinutes < 10 || durationMinutes > 120) {
      toast({
        title: "Invalid Duration",
        description: "Duration must be between 10 and 120 minutes",
        variant: "destructive",
      });
      return;
    }

    const validEmails = Array.from(new Set(emails.map((email) => email.trim()).filter(Boolean)));
    if (validEmails.length > 5) {
      toast({
        title: "Too Many Participants",
        description: "You can invite a maximum of 5 friends",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contest/create-realtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty,
          questionCount: effectiveQuestionCount,
          selectedQuestionIds: useQuestionPool ? selectedQuestionIds : [],
          contestName: contestName.trim(),
          description: description.trim(),
          durationMinutes,
          startDate: startDateTime.toISOString(),
          emails: validEmails,
          contestType,
          category: category.trim() || undefined,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create contest in WebSocket service");
      }

      const data = await response.json();

      const selectionText = useQuestionPool
        ? ` using ${selectedQuestionIds.length} curated question(s)`
        : ` with ${effectiveQuestionCount} generated question(s)`;

      if (validEmails.length > 0 && data.invitationsSent > 0) {
        toast({
          title: "Contest Created! 🎉",
          description: `Contest "${contestName}" created${selectionText}. ${data.invitationsSent} invitation(s) sent.`,
        });
      } else if (validEmails.length > 0 && data.invitationErrors?.length > 0) {
        toast({
          title: "Contest Created (with warnings)",
          description: `Contest created${selectionText}, but some invitations failed: ${data.invitationErrors[0]}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Contest Created! 🎉",
          description: `Contest "${contestName}" created${selectionText}.`,
        });
      }

      setOpen(false);
      setContestName("");
      setDescription("");
      setStartDateTime(new Date());
      setEmails([""]);
      setContestType("standard");
      setDifficulty("medium");
      setCategory("");
      setQuestionCount(10);
      setDurationMinutes(30);
      setTags("");
      setSelectedQuestionIds([]);
      setPoolSearch("");
      setPoolCategory("all");
      setPoolDifficulty("all");
      setSelectedPoolId("none");

      if (onSuccess) {
        onSuccess();
      }

      window.location.href = `/dashboard/contest/${data.contestId}/game`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create contest. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const modeBadge = useQuestionPool ? "Curated" : "Auto-generated";
  const endDateTimePreview = useMemo(
    () => new Date(startDateTime.getTime() + durationMinutes * 60000),
    [startDateTime, durationMinutes]
  );

  const progressSteps = [
    "Basics",
    "Format",
    "Questions",
    "Schedule",
    "Participants",
  ];

  const contestTypeOptions: Array<{ value: "quick_fire" | "standard" | "marathon"; label: string; hint: string }> = [
    { value: "quick_fire", label: "Quick Fire", hint: "Fast short challenge" },
    { value: "standard", label: "Standard", hint: "Balanced default mode" },
    { value: "marathon", label: "Marathon", hint: "Long deep-dive contest" },
  ];

  const difficultyOptions: Array<{ value: "easy" | "medium" | "hard"; label: string }> = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        {children ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(isLimitReached && "cursor-not-allowed")}>
                <DialogTrigger asChild disabled={isLimitReached}>
                  {children}
                </DialogTrigger>
              </span>
            </TooltipTrigger>
            {isLimitReached && (
              <TooltipContent>
                <p>You have reached the maximum limit of 2 contests.</p>
                <p className="text-xs text-muted-foreground mt-1">Delete an existing contest to create a new one.</p>
              </TooltipContent>
            )}
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(isLimitReached && "cursor-not-allowed")}>
                <DialogTrigger asChild disabled={isLimitReached}>
                  <Button disabled={isLimitReached}>
                    <Plus className="w-4 h-4 mr-2" />
                    {isLimitReached ? `Contest Limit Reached (${userContestCount}/2)` : "Create Contest"}
                  </Button>
                </DialogTrigger>
              </span>
            </TooltipTrigger>
            {isLimitReached && (
              <TooltipContent>
                <p>You have reached the maximum limit of 2 contests.</p>
                <p className="text-xs text-muted-foreground mt-1">Delete an existing contest to create a new one.</p>
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </TooltipProvider>

      <DialogContent className="h-[92vh] w-[min(1200px,calc(100vw-1.5rem))] max-w-none overflow-hidden rounded-2xl border border-primary/15 p-0 shadow-[0_38px_95px_-30px_rgba(0,0,0,0.58)] sm:max-w-none">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_45%)] bg-background">
          <DialogHeader className="space-y-4 border-b bg-background/90 px-4 py-5 pr-12 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <Sparkles className="h-5 w-5 text-primary" />
                Create New Contest
              </DialogTitle>
              <Badge variant={userContestCount >= 2 ? "destructive" : "secondary"} className="text-xs">
                {userContestCount}/2 Contests
              </Badge>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">{modeBadge}</Badge>
              {isAdmin && (
                <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin Curation Enabled
                </Badge>
              )}
            </div>

            <DialogDescription className="max-w-3xl text-sm">
              Build a high-impact coding contest with curated questions, clear scheduling, and participant invites in one streamlined flow.
            </DialogDescription>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="border-emerald-300/60 bg-emerald-50 text-emerald-700">Guided setup</Badge>
              <span>Start with basics, then lock in difficulty, question mode, and schedule.</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {progressSteps.map((step, idx) => (
                <div
                  key={step}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    idx === 0
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/80 bg-background/70 text-muted-foreground"
                  )}
                >
                  {idx + 1}. {step}
                </div>
              ))}
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="flex min-h-0 flex-col gap-4 xl:flex-row">
              <div className="min-w-0 flex-1">
                <div className="space-y-4 pb-2">
                  <section className="space-y-3 rounded-xl border border-primary/10 bg-background/95 p-4 shadow-sm ring-1 ring-black/5">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Contest Basics
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="contestName">Contest Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="contestName"
                        placeholder="Weekend Battle Arena"
                        value={contestName}
                        onChange={(e) => setContestName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Compete with your team in a timed challenge"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </section>

                  <section className="space-y-4 rounded-xl border border-primary/10 bg-background/95 p-4 shadow-sm ring-1 ring-black/5">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <ListChecks className="h-4 w-4 text-primary" />
                      Format
                    </h3>
                    <div className="space-y-2">
                      <Label>Contest Type</Label>
                      <div className="grid gap-2 md:grid-cols-3">
                        {contestTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setContestType(option.value)}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-left transition-all",
                              contestType === option.value
                                ? "border-primary/40 bg-primary/10 shadow-sm ring-1 ring-primary/20"
                                : "border-border bg-background hover:border-primary/20 hover:bg-muted/60"
                            )}
                          >
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.hint}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <div className="flex flex-wrap gap-2">
                        {difficultyOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={difficulty === option.value ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "rounded-full",
                              difficulty === option.value && "bg-primary text-primary-foreground"
                            )}
                            onClick={() => setDifficulty(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category (Optional)</Label>
                        <Input
                          id="category"
                          placeholder="Programming, Math, Logic"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          placeholder="arrays, dp, strings"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>
                          Number of Questions: <strong>{effectiveQuestionCount}</strong>
                        </Label>
                        <Slider
                          value={[questionCount]}
                          onValueChange={(value) => setQuestionCount(value[0])}
                          min={10}
                          max={50}
                          step={5}
                          className="py-3"
                          disabled={isAdmin && useQuestionPool && selectedQuestionCount > 0}
                        />
                        <p className="text-xs text-muted-foreground">
                          {isAdmin && useQuestionPool && selectedQuestionCount > 0
                            ? "Curated mode locks question count to selected pool size."
                            : "Min 10 and max 50 questions."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Contest Duration: <strong>{durationMinutes} min</strong>
                        </Label>
                        <Slider
                          value={[durationMinutes]}
                          onValueChange={(value) => setDurationMinutes(value[0])}
                          min={10}
                          max={120}
                          step={5}
                          className="py-3"
                        />
                        <p className="text-xs text-muted-foreground">Duration window: 10 to 120 minutes.</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4 rounded-xl border border-primary/10 bg-background/95 p-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold">
                          <ListChecks className="h-4 w-4 text-primary" />
                          Question Setup
                        </h3>
                        <p className="text-xs text-muted-foreground">Toggle between curated pool and auto generation anytime.</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border bg-background p-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={useQuestionPool ? "default" : "ghost"}
                          className="rounded-full"
                          onClick={() => setUseQuestionPool(true)}
                        >
                          Curated
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={useQuestionPool ? "ghost" : "default"}
                          className="rounded-full"
                          onClick={() => {
                            setUseQuestionPool(false);
                            setSelectedQuestionIds([]);
                          }}
                        >
                          Auto-generate
                        </Button>
                      </div>
                    </div>

                    {useQuestionPool && (
                      <div className="space-y-3 rounded-xl border border-border/70 bg-muted/35 p-3">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          <div className="space-y-1 md:col-span-2">
                            <Label>Saved Pool Name</Label>
                            <Select
                              value={selectedPoolId}
                              onValueChange={(value) => {
                                setSelectedPoolId(value);
                                void applyNamedPool(value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a saved pool" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None (manual selection)</SelectItem>
                                {namedPools.map((pool) => (
                                  <SelectItem key={pool.id} value={pool.id}>
                                    {pool.name} ({pool.questionCount})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => loadNamedPools()}
                              disabled={namedPoolsLoading}
                              className="w-full"
                            >
                              {namedPoolsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                              Refresh
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                          <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              className="pl-9"
                              placeholder="Search by question, category, or tag"
                              value={poolSearch}
                              onChange={(e) => setPoolSearch(e.target.value)}
                            />
                          </div>

                          <Select value={poolDifficulty} onValueChange={(value: "all" | "easy" | "medium" | "hard") => setPoolDifficulty(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All difficulties</SelectItem>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select value={poolCategory} onValueChange={setPoolCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All categories</SelectItem>
                              {poolCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="rounded-lg border border-primary/15 bg-gradient-to-r from-primary/10 to-sky-100/40 p-3 text-sm text-muted-foreground">
                          Selected: <span className="font-semibold text-foreground">{selectedQuestionCount}</span> question(s)
                          {selectedQuestionCount > 0 && (
                            <span> · {selectedSummary.points} pts · ~{selectedSummary.totalMinutes} min total solve time</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQuestionIds(questionPool.map((q) => q.id))}
                            disabled={questionPool.length === 0}
                          >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Select Visible
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQuestionIds([])}
                            disabled={selectedQuestionCount === 0}
                          >
                            <Square className="mr-2 h-4 w-4" />
                            Clear
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadQuestionPool()}
                            disabled={poolLoading}
                          >
                            {poolLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Refresh
                          </Button>
                        </div>

                        {poolError && <p className="text-sm text-destructive">{poolError}</p>}

                        <Separator />

                        <ScrollArea className="h-[260px] rounded-lg border border-border/60 bg-background/80 p-2">
                          <div className="space-y-2 pr-3">
                            {poolLoading && questionPool.length === 0 && (
                              <div className="flex items-center justify-center py-10 text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading question pool...
                              </div>
                            )}

                            {!poolLoading && questionPool.length === 0 && (
                              <div className="py-10 text-center text-sm text-muted-foreground">
                                No questions found for current filters.
                              </div>
                            )}

                            {questionPool.map((question) => {
                              const checked = selectedQuestionIds.includes(question.id);
                              return (
                                <div
                                  key={question.id}
                                  className={cn(
                                    "rounded-lg border p-3 transition-colors",
                                    checked ? "border-primary/35 bg-primary/10 shadow-sm" : "hover:bg-muted/40"
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(value) => toggleQuestionSelection(question.id, Boolean(value))}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="line-clamp-2 text-sm font-medium">{question.questionText}</p>
                                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <Badge variant="outline">{question.difficulty}</Badge>
                                        <Badge variant="secondary">{question.category}</Badge>
                                        <Badge variant="outline">{question.points} pts</Badge>
                                        <Badge variant="outline">{question.timeAllocationSeconds}s</Badge>
                                        {question.tags?.slice(0, 2).map((tag) => (
                                          <Badge key={`${question.id}-${tag}`} variant="outline">{tag}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 rounded-xl border border-primary/10 bg-background/95 p-4 shadow-sm ring-1 ring-black/5">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <Timer className="h-4 w-4 text-primary" />
                      Schedule
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDateTime && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDateTime ? format(startDateTime, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDateTime}
                              onSelect={(date) => {
                                if (!date) return;
                                const newDate = new Date(date);
                                newDate.setHours(startDateTime.getHours());
                                newDate.setMinutes(startDateTime.getMinutes());
                                setStartDateTime(newDate);
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Select
                          value={`${startDateTime.getHours().toString().padStart(2, "0")}:${startDateTime.getMinutes().toString().padStart(2, "0")}`}
                          onValueChange={(time) => {
                            const [hours, minutes] = time.split(":").map(Number);
                            const newDate = new Date(startDateTime);
                            newDate.setHours(hours);
                            newDate.setMinutes(minutes);
                            setStartDateTime(newDate);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {Array.from({ length: 96 }, (_, i) => {
                              const hours = Math.floor(i / 4);
                              const minutes = (i % 4) * 15;
                              const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                              const displayTime = new Date(0, 0, 0, hours, minutes).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              });
                              return (
                                <SelectItem key={timeStr} value={timeStr}>
                                  {displayTime}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
                      <p className="mb-1 font-medium text-foreground">Timeline Preview</p>
                      <p>Start: {format(startDateTime, "PPP 'at' p")}</p>
                      <p>End: {format(endDateTimePreview, "PPP 'at' p")}</p>
                    </div>
                  </section>

                  <section className="space-y-3 rounded-xl border border-primary/10 bg-background/95 p-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold">
                          <Users2 className="h-4 w-4 text-primary" />
                          Participants
                        </h3>
                        <p className="text-xs text-muted-foreground">Invite up to 5 participants. You can invite later too.</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddEmail}
                        disabled={emails.length >= 5}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Email
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {emails.map((email, index) => (
                        <div key={`email-input-${index}`} className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="participant@example.com"
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                          />
                          {emails.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveEmail(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <aside className="hidden w-[320px] shrink-0 self-start rounded-xl border border-primary/10 bg-background/95 p-4 shadow-sm ring-1 ring-black/5 xl:flex xl:flex-col">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Live Summary</h3>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                    <p className="text-xs uppercase tracking-wide text-primary">Questions</p>
                    <p className="text-2xl font-semibold text-primary">{effectiveQuestionCount}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated Points</p>
                    <p className="text-xl font-semibold">{useQuestionPool ? selectedSummary.points : effectiveQuestionCount * 100}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Duration</p>
                    <p className="text-xl font-semibold">{durationMinutes} min</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Invites</p>
                    <p className="text-xl font-semibold">{emails.filter((email) => email.trim()).length}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-border/70 bg-muted/50 p-3 text-sm">
                  <p className="font-medium">Schedule</p>
                  <p className="mt-1 text-muted-foreground">{format(startDateTime, "MMM d, p")}</p>
                  <p className="text-muted-foreground">to {format(endDateTimePreview, "MMM d, p")}</p>
                </div>

                <div className="mt-4 rounded-lg border border-border/70 bg-muted/50 p-3 text-sm">
                  <p className="font-medium">Mode</p>
                  <p className="mt-1 text-muted-foreground">{modeBadge} • {difficulty}</p>
                  <p className="text-muted-foreground">{contestType.replace("_", " ")}</p>
                </div>

                <div className="mt-auto rounded-lg border border-primary/20 bg-gradient-to-r from-primary/15 to-sky-100/50 p-3 text-xs text-primary">
                  Keep this panel open while configuring to catch timing and scoring mistakes early.
                </div>
              </aside>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-36 bg-primary hover:bg-primary/90">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Contest
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
