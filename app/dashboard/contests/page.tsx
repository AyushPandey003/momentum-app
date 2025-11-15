"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Mail
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { CreateContestDialog } from "@/components/create-contest-dialog"
import { cn } from "@/lib/utils"
import { 
  getActiveContests, 
  getUserContests, 
  getCompletedContests,
  getInvitedContests,
  deleteContest
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
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contestToDelete, setContestToDelete] = useState<string | null>(null)
  const { data: session, isPending } = authClient.useSession()
  const { toast } = useToast()

  const loadContests = async () => {
    if (!session?.user?.id || !session?.user?.email) {
      return
    }

    setLoading(true)
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
      await deleteContest(contestToDelete)
      toast({
        title: "Success",
        description: "Contest deleted successfully"
      })
      loadContests()
    } catch (error) {
      console.error("Error deleting contest:", error)
      toast({
        title: "Error",
        description: "Failed to delete contest",
        variant: "destructive"
      })
    } finally {
      setDeleteDialogOpen(false)
      setContestToDelete(null)
    }
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

  const renderInvitedContestCard = (invitation: any) => {
    const contest = invitation
    const participantCount = contest._count?.participants || 0

    return (
      <Card key={contest.id} className="hover:shadow-lg transition-shadow border-primary/50">
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
            className="flex-1"
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
    const canStart = isCreator && contest.status === "draft"
    const canJoin = contest.status === "waiting" || contest.status === "in_progress"
    const isFinished = contest.status === "finished"

    return (
      <Card key={contest.id} className="hover:shadow-lg transition-shadow">
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
                className="flex-1"
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
                onClick={() => {
                  setContestToDelete(contest.id)
                  setDeleteDialogOpen(true)
                }}
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
            <Button 
              onClick={() => router.push(`/dashboard/contest/${contest.id}/leaderboard`)}
              variant="outline"
              className="flex-1"
            >
              View Results
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contests</h1>
          <p className="text-muted-foreground mt-2">
            Create, join, and compete in coding contests
          </p>
        </div>
        <CreateContestDialog onSuccess={loadContests} userContestCount={myContests.length}>
          <Button size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Contest
          </Button>
        </CreateContestDialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All Contests
            {allContests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {allContests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invited">
            Invited
            {invitedContests.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                {invitedContests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mine">
            My Contests
            {myContests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {myContests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completedContests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {completedContests.length}
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
              {allContests.length === 0 ? (
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
                <div className="grid gap-4 md:grid-cols-2">
                  {allContests.map((contest) => 
                    renderContestCard(contest, contest.createdBy === session.user.id)
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invited" className="space-y-4">
              {invitedContests.length === 0 ? (
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
                <div className="grid gap-4 md:grid-cols-2">
                  {invitedContests.map((invitation) => 
                    renderInvitedContestCard(invitation)
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mine" className="space-y-4">
              {myContests.length === 0 ? (
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
                <div className="grid gap-4 md:grid-cols-2">
                  {myContests.map((contest) => renderContestCard(contest, true))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedContests.length === 0 ? (
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
                <div className="grid gap-4 md:grid-cols-2">
                  {completedContests.map((contest) => 
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contest
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContest}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
