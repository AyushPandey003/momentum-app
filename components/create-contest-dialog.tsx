"use client";

import { useState, ReactNode } from "react";
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
import { Plus, Trash2, Send } from "lucide-react";
import { createContest, inviteToContest } from "@/server/contests";
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

interface CreateContestDialogProps {
  children?: ReactNode;
  onSuccess?: () => void;
  userContestCount?: number;
}

export function CreateContestDialog({ children, onSuccess, userContestCount = 0 }: CreateContestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contestName, setContestName] = useState("");
  const [description, setDescription] = useState("");
  const [startDateTime, setStartDateTime] = useState<Date>(new Date());
  const [emails, setEmails] = useState<string[]>([""]);
  
  // New fields
  const [contestType, setContestType] = useState<"quick_fire" | "standard" | "marathon">("standard");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [category, setCategory] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [tags, setTags] = useState<string>("");
  
  const { toast } = useToast();
  const isLimitReached = userContestCount >= 2;

  const handleAddEmail = () => {
    setEmails([...emails, ""]);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contestName) {
      toast({
        title: "Missing Information",
        description: "Please provide a contest name",
        variant: "destructive",
      });
      return;
    }

    // Calculate end time based on start time and duration
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

    if (questionCount < 10 || questionCount > 50) {
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

    // Validate max 5 participants
    const validEmails = emails.filter((email) => email.trim() !== "");
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
      // All contests now use WebSocket service for real-time functionality
      // Create contest via WebSocket service API
      const response = await fetch("/api/contest/create-realtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            difficulty,
            questionCount,
            contestName,
            description,
            durationMinutes,
            // Send the selected start date/time so the server can store the scheduled start
            startDate: startDateTime.toISOString(),
            emails: validEmails // Pass emails to backend for invitation system
          }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create contest in WebSocket service");
      }

      const data = await response.json();
      
      // Show appropriate toast based on invitation results
      if (validEmails.length > 0) {
        if (data.invitationsSent > 0) {
          toast({
            title: "Contest Created! 🎉",
            description: `Contest "${contestName}" created with ${questionCount} questions. ${data.invitationsSent} invitation(s) sent successfully!`,
          });
        } else if (data.invitationErrors && data.invitationErrors.length > 0) {
          toast({
            title: "Contest Created (with warnings) ⚠️",
            description: `Contest created but failed to send invitations: ${data.invitationErrors[0]}. You may need to configure Gmail credentials.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Contest Created! 🎉",
            description: `Contest "${contestName}" created with ${questionCount} questions. Invitations created but email sending may have failed.`,
          });
        }
      } else {
        toast({
          title: "Contest Created! 🎉",
          description: `Real-time contest "${contestName}" created with ${questionCount} questions.`,
        });
      }

      setOpen(false);
      // Reset form
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
      
      // Redirect to the game page with the WebSocket contest ID
      window.location.href = `/dashboard/contest/${data.contestId}/game`;
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create contest. Please try again.";
      
      // Check if it's a limit error
      if (errorMessage.includes("maximum limit")) {
        toast({
          title: "Contest Limit Reached",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Contest/Challenge
            <Badge variant={userContestCount >= 2 ? "destructive" : "secondary"} className="text-xs">
              {userContestCount}/2 Contests
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Create a contest with custom difficulty, duration, and question count. Invite up to 5 friends to compete!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="space-y-2">
              <Label htmlFor="contestName">
                Contest Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contestName"
                placeholder="Summer Coding Challenge"
                value={contestName}
                onChange={(e) => setContestName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Test your skills and compete with friends!"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Contest Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Contest Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contest Type <span className="text-red-500">*</span></Label>
                <Select value={contestType} onValueChange={(value: any) => setContestType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick_fire">Quick Fire (Fast-paced)</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="marathon">Marathon (Extended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty <span className="text-red-500">*</span></Label>
                <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
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

            <div className="space-y-2">
              <Label htmlFor="category">Category (Filter)</Label>
              <Input
                id="category"
                placeholder="e.g., Programming, Math, Logic, General Knowledge"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Optional: Filter questions by category</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., algorithms, data-structures, problem-solving"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Optional: Additional filters for question selection</p>
            </div>

            <div className="space-y-2">
              <Label>
                Number of Questions: <strong>{questionCount}</strong> <span className="text-red-500">*</span>
              </Label>
              <Slider
                value={[questionCount]}
                onValueChange={(value) => setQuestionCount(value[0])}
                min={10}
                max={50}
                step={5}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">Min: 10, Max: 50 questions</p>
            </div>

            <div className="space-y-2">
              <Label>
                Contest Duration: <strong>{durationMinutes} minutes</strong> <span className="text-red-500">*</span>
              </Label>
              <Slider
                value={[durationMinutes]}
                onValueChange={(value) => setDurationMinutes(value[0])}
                min={10}
                max={120}
                step={5}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">Min: 10 min, Max: 120 min (2 hours)</p>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Contest Schedule</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Start Date <span className="text-red-500">*</span>
                </Label>
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
                        if (date) {
                          // Preserve existing time when changing date
                          const newDate = new Date(date);
                          newDate.setHours(startDateTime.getHours());
                          newDate.setMinutes(startDateTime.getMinutes());
                          setStartDateTime(newDate);
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={`${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`}
                  onValueChange={(time) => {
                    const [hours, minutes] = time.split(':').map(Number);
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
                      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      const displayTime = new Date(0, 0, 0, hours, minutes).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
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
              <p>
                Start: {format(startDateTime, "PPP 'at' p")}
              </p>
              <p>
                End: {format(new Date(startDateTime.getTime() + durationMinutes * 60000), "PPP 'at' p")}
              </p>
            </div>
          </div>

          {/* Invitations */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Invite Participants (Max 5)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Question sets won't be visible to organizer until results are revealed
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
            <p className="text-sm text-muted-foreground">
              Participants will receive an email invitation to join the contest
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                "Creating..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create & Send Invites
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
