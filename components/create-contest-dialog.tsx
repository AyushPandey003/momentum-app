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
import { Plus, Trash2, Send, Search, ShieldCheck, Loader2, CheckSquare, Square, RefreshCw } from "lucide-react";
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
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [useQuestionPool, setUseQuestionPool] = useState(true);

  const { toast } = useToast();
  const isLimitReached = userContestCount >= 2;

  const selectedQuestionCount = selectedQuestionIds.length;
  const effectiveQuestionCount = isAdmin && useQuestionPool && selectedQuestionCount > 0 ? selectedQuestionCount : questionCount;

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

      if (response.status === 403) {
        setIsAdmin(false);
        setUseQuestionPool(false);
        setQuestionPool([]);
        setPoolCategories([]);
        return;
      }

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

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadQuestionPool(controller.signal);
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, loadQuestionPool]);

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

    if (isAdmin && useQuestionPool && selectedQuestionIds.length === 0) {
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

    if (!(isAdmin && useQuestionPool && selectedQuestionIds.length > 0) && (questionCount < 10 || questionCount > 50)) {
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
          selectedQuestionIds: isAdmin && useQuestionPool ? selectedQuestionIds : [],
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

      const selectionText = isAdmin && useQuestionPool
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

  const modeBadge = isAdmin && useQuestionPool ? "Curated" : "Auto-generated";

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

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Contest
            <Badge variant={userContestCount >= 2 ? "destructive" : "secondary"} className="text-xs">
              {userContestCount}/2 Contests
            </Badge>
            <Badge variant="outline">{modeBadge}</Badge>
          </DialogTitle>
          <DialogDescription>
            Configure contest settings, optionally invite participants, and for admins curate exact questions from the pool.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
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
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Contest Configuration</h3>
              {isAdmin && (
                <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-sm">Admin controls enabled</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contest Type</Label>
                <Select value={contestType} onValueChange={(value: "quick_fire" | "standard" | "marathon") => setContestType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick_fire">Quick Fire</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="marathon">Marathon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="py-4"
                disabled={isAdmin && useQuestionPool && selectedQuestionCount > 0}
              />
              <p className="text-xs text-muted-foreground">
                {isAdmin && useQuestionPool && selectedQuestionCount > 0
                  ? "Curated mode locks question count to selected pool size."
                  : "Min: 10, Max: 50 questions"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Contest Duration: <strong>{durationMinutes} minutes</strong>
              </Label>
              <Slider
                value={[durationMinutes]}
                onValueChange={(value) => setDurationMinutes(value[0])}
                min={10}
                max={120}
                step={5}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">Min: 10 min, Max: 120 min</p>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Question Pool Selection</h3>
                  <p className="text-sm text-muted-foreground">Choose exact questions for curated contests.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="use-question-pool"
                    checked={useQuestionPool}
                    onCheckedChange={(checked) => setUseQuestionPool(Boolean(checked))}
                  />
                  <Label htmlFor="use-question-pool">Use curated pool</Label>
                </div>
              </div>

              {useQuestionPool && (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="md:col-span-2 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search by question text, category or tag"
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

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                      Selected: <strong>{selectedQuestionCount}</strong> question(s)
                      {selectedQuestionCount > 0 && (
                        <span> · {selectedSummary.points} pts · ~{selectedSummary.totalMinutes} min total solve time</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuestionIds(questionPool.map((q) => q.id))}
                        disabled={questionPool.length === 0}
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Select Visible
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuestionIds([])}
                        disabled={selectedQuestionCount === 0}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadQuestionPool()}
                        disabled={poolLoading}
                      >
                        {poolLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Refresh
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {poolError && <p className="text-sm text-destructive">{poolError}</p>}

                  <ScrollArea className="h-[280px]">
                    <div className="space-y-2 pr-3">
                      {poolLoading && questionPool.length === 0 && (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading question pool...
                        </div>
                      )}

                      {!poolLoading && questionPool.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                          No questions found for current filters.
                        </div>
                      )}

                      {questionPool.map((question) => {
                        const checked = selectedQuestionIds.includes(question.id);
                        return (
                          <div
                            key={question.id}
                            className={cn(
                              "rounded-md border p-3 transition-colors",
                              checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => toggleQuestionSelection(question.id, Boolean(value))}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">{question.questionText}</p>
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
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Contest Schedule</h3>

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

            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Contest Duration: {durationMinutes} minutes</p>
              <p>Start: {format(startDateTime, "PPP 'at' p")}</p>
              <p>End: {format(new Date(startDateTime.getTime() + durationMinutes * 60000), "PPP 'at' p")}</p>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Invite Participants (Max 5)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Invitation emails are optional. You can also invite later.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEmail}
                disabled={emails.length >= 5}
              >
                <Plus className="w-4 h-4 mr-2" />
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
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
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
