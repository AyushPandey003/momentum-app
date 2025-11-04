"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UploadButton } from "@/lib/uploadthing"
import { Image, CheckCircle2, Loader2 } from "lucide-react"
import type { Task } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface TaskCompletionDialogProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onComplete: (taskId: string, imageUrl: string) => Promise<void>
}

export function TaskCompletionDialog({
  task,
  isOpen,
  onClose,
  onComplete,
}: TaskCompletionDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(task?.verificationImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const { toast } = useToast()

  if (!task) return null

  const handleUploadComplete = (res: any) => {
    const url = res?.[0]?.url ?? (res?.[0] as any)?.ufsUrl
    if (url) {
      setImageUrl(url)
      setIsUploading(false)
      toast({
        title: "Image uploaded!",
        description: "Verification image attached successfully.",
      })
    }
  }

  const handleUploadError = (error: Error) => {
    setIsUploading(false)
    toast({
      title: "Upload failed",
      description: error.message,
      variant: "destructive",
    })
  }

  const handleComplete = async () => {
    if (!imageUrl) {
      toast({
        title: "Image required",
        description: "Please upload a verification image to complete this task.",
        variant: "destructive",
      })
      return
    }

    setIsCompleting(true)
    try {
      await onComplete(task.id, imageUrl)
      toast({
        title: "Task completed!",
        description: "Your task has been marked as completed. Waiting for manager confirmation.",
      })
      onClose()
      setImageUrl(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Task</DialogTitle>
          <DialogDescription>
            Upload proof of completion for "{task.title}". Your manager will review and confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Image</label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-4">
              {imageUrl ? (
                <div className="space-y-3 w-full">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={imageUrl}
                      alt="Verification"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImageUrl(null)}
                      className="flex-1"
                    >
                      Change Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(imageUrl, "_blank")}
                      className="flex-1"
                    >
                      <Image className="w-4 h-4 mr-2" />
                      View Full
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Image className="w-12 h-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">Upload verification image</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Take a photo or upload proof that you completed this task
                    </p>
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                      onUploadBegin={() => setIsUploading(true)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {task.managerEmail && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <strong>Manager:</strong> {task.managerEmail}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your manager will review and confirm your completion after you submit.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isCompleting}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!imageUrl || isUploading || isCompleting}
              className="min-w-[120px]"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Task
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

