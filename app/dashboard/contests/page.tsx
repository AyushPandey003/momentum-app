"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  ArrowRight, 
  Plus,
  PlayCircle,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Search,
  RefreshCw
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { CreateContestDialog } from "@/components/create-contest-dialog"
import { cn } from "@/lib/utils"
import { 
  getActiveContests, 
  getUserContests, 
  getCompletedContests,
  getInvitedContests,
  deleteContest,
  removeCompletedContestForUser
} from "@/server/contests"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Contest {
  id: string
  name: string
  description: string | null
  status: string
  createdBy: string
  startDate: Date | null
  endDate: Date | null
  difficulty: string | null
  category: string | null
  questionCount: number
  durationMinutes: number
  maxParticipants: number
  isPrivate: boolean
  createdAt: Date
  participants?: any[]
  _count?: {
    participants: number
  }
}

export default function ContestsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [allContests, setAllContests] = useState<Contest[]>([])
  const [myContests, setMyContests] = useState<Contest[]>([])
  const [completedContests, setCompletedContests] = useState<Contest[]>([])
  const [invitedContests, setInvitedContests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"soonest" | "participants" | "newest">("soonest")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contestToDelete, setContestToDelete] = useState<string | null>(null)
  const [contestToDeleteName, setContestToDeleteName] = useState<string>("")
  const [deleteMode, setDeleteMode] = useState<"contest" | "history">("contest")
  const { data: session, isPending } = authClient.useSession()
  const { toast } = useToast()
  const contestLimitReached = myContests.length >= 2

  const loadContests = async () => {
    if (!session?.user?.id || !session?.user?.email) {
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const [active, mine, completed, invited] = await Promise.all([
        getActiveContests(),
        getUserContests(session.user.id),
        getCompletedContests(session.user.id),
        getInvitedContests(session.user.email)
      ])
      setAllContests(active)
      setMyContests(mine)
      setCompletedContests(completed)
      setInvitedContests(invited)
    } catch (error) {
      console.error("Error loading contests:", error)
      setLoadError("Could not load contests. Please check your connection and try again.")
      toast({
        title: "Error",
        description: "Failed to load contests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isPending && session?.user?.id) {
      loadContests()
    }
  }, [session?.user?.id, isPending])

  const handleDeleteContest = async () => {
    if (!contestToDelete) return

    try {
      if (deleteMode === "contest") {
        await deleteContest(contestToDelete)
        toast({
          title: "Success",
          description: "Contest deleted successfully"
        })
      } else {
        await removeCompletedContestForUser(contestToDelete)
        toast({
          title: "Success",
          description: "Contest removed from your completed history"
        })
      }
      loadContests()
    } catch (error) {
      console.error("Error deleting contest:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete contest"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setDeleteDialogOpen(false)
      setContestToDelete(null)
      setContestToDeleteName("")
      setDeleteMode("contest")
    }
  }

  const openDeleteDialog = (contest: Contest, isCreator: boolean) => {
    setContestToDelete(contest.id)
    setContestToDeleteName(contest.name)
    setDeleteMode(isCreator ? "contest" : "history")
    setDeleteDialogOpen(true)
  }

  const handleJoinContest = (contestId: string) => {
    router.push(`/dashboard/contest/${contestId}/lobby`)
  }

  const handleStartContest = async (contestId: string) => {
    // Navigate directly to lobby - WebSocket service handles contest status
    router.push(`/dashboard/contest/${contestId}/lobby`)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-gray-500" },
      waiting: { label: "Waiting", className: "bg-yellow-500" },
      in_progress: { label: "In Progress", className: "bg-green-500" },
      finished: { label: "Finished", className: "bg-blue-500" },
      cancelled: { label: "Cancelled", className: "bg-red-500" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    
    return (
      <Badge className={cn("text-white", config.className)}>
        {config.label}
      </Badge>
    )
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800"
    }
    
    return (
      <Badge variant="outline" className={colors[difficulty as keyof typeof colors]}>
        {difficulty}
      </Badge>
    )
  }

  const getContestTimestamp = (contest: Contest) => {
    if (contest.startDate) return new Date(contest.startDate).getTime()
    return new Date(contest.createdAt).getTime()
  }

  const matchesSearch = (contest: Contest, query: string) => {
    if (!query.trim()) return true
    const normalizedQuery = query.toLowerCase()
    return (
      contest.name.toLowerCase().includes(normalizedQuery) ||
      contest.description?.toLowerCase().includes(normalizedQuery) ||
      contest.category?.toLowerCase().includes(normalizedQuery)
    )
  }

  const filterAndSortContests = (contests: Contest[]) => {
    const filtered = contests.filter((contest) => {
      const statusMatches = statusFilter === "all" || contest.status === statusFilter
      return statusMatches && matchesSearch(contest, searchQuery)
    })

    return filtered.sort((a, b) => {
      if (sortBy === "participants") {
        const aParticipants = a.participants?.length || a._count?.participants || 0
        const bParticipants = b.participants?.length || b._count?.participants || 0
        return bParticipants - aParticipants
      }

      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }

      return getContestTimestamp(a) - getContestTimestamp(b)
    })
  }

  const filteredAllContests = filterAndSortContests(allContests)
  const filteredInvitedContests = invitedContests.filter((invitation: any) => matchesSearch(invitation, searchQuery))
  const filteredMyContests = filterAndSortContests(myContests)
  const filteredCompletedContests = filterAndSortContests(completedContests)

  const renderInvitedContestCard = (invitation: any) => {
    const contest = invitation
    const participantCount = contest._count?.participants || 0

    return (
      <Card key={contest.id} className="group border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {contest.name}
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  <Mail className="w-3 h-3 mr-1" />
                  Invitation
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                {contest.description || "No description provided"}
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                Invited by: {invitation.invitedBy}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {getStatusBadge(contest.status)}
              {contest.difficulty && getDifficultyBadge(contest.difficulty)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span>{contest.questionCount} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{contest.durationMinutes} Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{participantCount}/{contest.maxParticipants} Participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {contest.startDate 
                  ? format(new Date(contest.startDate), "MMM dd, yyyy")
                  : "Not scheduled"}
              </span>
            </div>
          </div>

          {contest.category && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{contest.category}</Badge>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button 
            onClick={() => router.push(`/api/accept-contest-invitation/${invitation.invitationToken}`)}
            className="flex-1 bg-primary/95 transition-all group-hover:bg-primary"
          >
            Join Contest
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/contest/${contest.id}`)}
          >
            View Details
            <Trophy className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const renderContestCard = (contest: Contest, isCreator: boolean) => {
    const participantCount = contest.participants?.length || contest._count?.participants || 0
    
    // Check if contest has expired (end time passed)
    const now = new Date()
    const actualEndTime = contest.endDate ? new Date(contest.endDate) : null
    const hasExpired = actualEndTime && actualEndTime < now
    const availableSpots = Math.max(0, contest.maxParticipants - participantCount)
    
    const canJoin = !hasExpired && (contest.status === "waiting" || contest.status === "in_progress")
    const isFinished = contest.status === "finished" || hasExpired

    return (
      <Card key={contest.id} className="group border-border/60 bg-gradient-to-br from-background via-background to-muted/35 transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {contest.name}
                {isCreator && <Badge variant="secondary">Host</Badge>}
              </CardTitle>
              <CardDescription className="mt-2">
                {contest.description || "No description provided"}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              {getStatusBadge(contest.status)}
              {contest.difficulty && getDifficultyBadge(contest.difficulty)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span>{contest.questionCount} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{contest.durationMinutes} Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{participantCount}/{contest.maxParticipants} Participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{availableSpots} spots left</span>
            </div>
            {contest.category && (
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span>{contest.category}</span>
              </div>
            )}
          </div>

          {(contest.startDate || contest.endDate) && (
            <div className="space-y-2 text-sm text-muted-foreground">
              {contest.startDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    <strong>Start:</strong> {format(new Date(contest.startDate), "PPP 'at' p")}
                  </span>
                </div>
              )}
              {contest.endDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    <strong>End:</strong> {format(new Date(contest.endDate), "PPP 'at' p")}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {isCreator && contest.status === "draft" && (
            <>
              <Button 
                onClick={() => handleStartContest(contest.id)}
                className="flex-1 bg-primary/95 transition-all group-hover:bg-primary"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Contest
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push(`/dashboard/contests/${contest.id}/edit`)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push(`/dashboard/contests/${contest.id}/invite`)}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
              <Button 
                variant="destructive"
                onClick={() => openDeleteDialog(contest, isCreator)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}

          {canJoin && (
            <Button 
              onClick={() => handleJoinContest(contest.id)}
              className="flex-1"
            >
              {isCreator ? "Enter Contest" : "Join Contest"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {isFinished && (
            <>
              <Button 
                onClick={() => router.push(`/dashboard/contest/${contest.id}/leaderboard`)}
                variant="outline"
                className="flex-1"
              >
                View Results
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="destructive"
                onClick={() => openDeleteDialog(contest, isCreator)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    )
  }

  // Show loading while checking authentication
  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_46%)]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contests</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Launch structured coding battles, track live participation, and keep your competitive streak alive.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-primary">
                {myContests.length}/2 Hosted
              </Badge>
              <span>{allContests.length} active in rotation</span>
            </div>
          </div>
          <CreateContestDialog onSuccess={loadContests} userContestCount={myContests.length}>
            <Button
              size="lg"
              className="w-full min-w-52 bg-primary/95 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary sm:w-auto"
              disabled={contestLimitReached}
            >
              <Plus className="w-5 h-5 mr-2" />
              {contestLimitReached ? "Contest Limit Reached" : "Create Contest"}
            </Button>
          </CreateContestDialog>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-200/70 bg-emerald-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Active</p>
              <PlayCircle className="h-4 w-4 text-emerald-700" />
            </div>
            <p className="mt-1 text-2xl font-semibold">{allContests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-sky-200/70 bg-sky-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Invitations</p>
              <Mail className="h-4 w-4 text-sky-700" />
            </div>
            <p className="mt-1 text-2xl font-semibold">{invitedContests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200/70 bg-amber-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Hosted by you</p>
              <Trophy className="h-4 w-4 text-amber-700" />
            </div>
            <p className="mt-1 text-2xl font-semibold">{myContests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-violet-200/70 bg-violet-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Completed</p>
              <CheckCircle className="h-4 w-4 text-violet-700" />
            </div>
            <p className="mt-1 text-2xl font-semibold">{completedContests.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, category, or description"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                type="button"
                variant={statusFilter === "waiting" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setStatusFilter("waiting")}
              >
                Waiting
              </Button>
              <Button
                type="button"
                variant={statusFilter === "in_progress" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setStatusFilter("in_progress")}
              >
                Live
              </Button>
              <Button
                type="button"
                variant={statusFilter === "finished" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setStatusFilter("finished")}
              >
                Finished
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sort</p>
            <Button
              type="button"
              variant={sortBy === "soonest" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSortBy("soonest")}
            >
              Start Time
            </Button>
            <Button
              type="button"
              variant={sortBy === "participants" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSortBy("participants")}
            >
              Most Participants
            </Button>
            <Button
              type="button"
              variant={sortBy === "newest" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSortBy("newest")}
            >
              Newest
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={loadContests}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loadError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-center justify-between gap-3">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button type="button" size="sm" variant="outline" onClick={loadContests}>
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl border border-border/70 bg-muted/40 p-2">
          <TabsTrigger value="all">
            All Contests
            {filteredAllContests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredAllContests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invited">
            Invited
            {filteredInvitedContests.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                {filteredInvitedContests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mine">
            My Contests
            {filteredMyContests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredMyContests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {filteredCompletedContests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredCompletedContests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              {filteredAllContests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Contests</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      There are no active contests at the moment. Create one to get started!
                    </p>
                    <CreateContestDialog onSuccess={loadContests} userContestCount={myContests.length}>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Contest
                      </Button>
                    </CreateContestDialog>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredAllContests.map((contest) => 
                    renderContestCard(contest, contest.createdBy === session.user.id)
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invited" className="space-y-4">
              {filteredInvitedContests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
                    <p className="text-muted-foreground text-center">
                      You don't have any pending contest invitations at the moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredInvitedContests.map((invitation) => 
                    renderInvitedContestCard(invitation)
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mine" className="space-y-4">
              {filteredMyContests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Contests Created</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      You haven't created any contests yet. Create your first contest!
                    </p>
                    <CreateContestDialog onSuccess={loadContests} userContestCount={myContests.length}>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Contest
                      </Button>
                    </CreateContestDialog>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredMyContests.map((contest) => renderContestCard(contest, true))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filteredCompletedContests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Completed Contests</h3>
                    <p className="text-muted-foreground text-center">
                      You haven't participated in any completed contests yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCompletedContests.map((contest) => 
                    renderContestCard(contest, contest.createdBy === session.user.id)
                  )}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteMode === "contest" ? "Delete contest?" : "Remove from completed history?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === "contest"
                ? `This action cannot be undone. This will permanently delete ${contestToDeleteName || "this contest"} and remove all associated data.`
                : `This removes ${contestToDeleteName || "this contest"} from your completed contests. Other participants and the host will still keep their records.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContest}>
              {deleteMode === "contest" ? "Delete Contest" : "Remove From History"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
