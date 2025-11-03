"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { use } from "react"

export default function EditContestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contestName, setContestName] = useState("")
  const [description, setDescription] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Load contest details
    const loadContest = async () => {
      try {
        // TODO: Implement getContestById function in server/contests.ts
        setLoading(false)
      } catch (error) {
        console.error("Error loading contest:", error)
        toast({
          title: "Error",
          description: "Failed to load contest details",
          variant: "destructive"
        })
      }
    }

    loadContest()
  }, [resolvedParams.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: Implement updateContest function in server/contests.ts
      toast({
        title: "Success",
        description: "Contest updated successfully"
      })
      router.push("/dashboard/contests")
    } catch (error) {
      console.error("Error updating contest:", error)
      toast({
        title: "Error",
        description: "Failed to update contest",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Contest</h1>
          <p className="text-muted-foreground mt-2">
            Update contest details and settings
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contest Information</CardTitle>
          <CardDescription>
            Update the basic information about your contest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Contest Name</Label>
            <Input
              id="name"
              value={contestName}
              onChange={(e) => setContestName(e.target.value)}
              placeholder="Enter contest name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter contest description"
              rows={4}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
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
