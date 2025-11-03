"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Send, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { inviteToContest } from "@/server/contests"
import { use } from "react"

export default function InviteToContestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [emails, setEmails] = useState<string[]>([""])
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const handleAddEmail = () => {
    setEmails([...emails, ""])
  }

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const handleSendInvites = async () => {
    const validEmails = emails.filter((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return email.trim() !== "" && emailRegex.test(email)
    })

    if (validEmails.length === 0) {
      toast({
        title: "No Valid Emails",
        description: "Please enter at least one valid email address",
        variant: "destructive"
      })
      return
    }

    if (validEmails.length > 5) {
      toast({
        title: "Too Many Participants",
        description: "You can invite a maximum of 5 friends",
        variant: "destructive"
      })
      return
    }

    setSending(true)
    try {
      await inviteToContest({
        contestId: resolvedParams.id,
        emails: validEmails
      })

      toast({
        title: "Invitations Sent! 🎉",
        description: `${validEmails.length} invitation(s) sent successfully`
      })

      router.push("/dashboard/contests")
    } catch (error: any) {
      console.error("Error sending invites:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Participants</h1>
          <p className="text-muted-foreground mt-2">
            Invite friends to join your contest (max 5 participants)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Invitations</CardTitle>
          <CardDescription>
            Enter the email addresses of people you want to invite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor={`email-${index}`} className="sr-only">
                  Email {index + 1}
                </Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder="friend@example.com"
                />
              </div>
              {emails.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveEmail(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}

          {emails.length < 5 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddEmail}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Email
            </Button>
          )}

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSendInvites} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitations
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
