"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createConversation, generateOnboardingAIResponse } from "@/action/chat"

interface OnboardingGuideDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  initialPlatform: string
}

export const OnboardingGuideDialog: React.FC<OnboardingGuideDialogProps> = ({ open, setOpen, initialPlatform }) => {
  const router = useRouter()
  const [platform, setPlatform] = useState(initialPlatform)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setPlatform(initialPlatform)
  }, [initialPlatform])

  const handleSubmit = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const newConversation = await createConversation(
        comment.trim().split(" ").slice(0, 3).join(" "),
        "BakerLab",
        "Onboarding", // Use platform state, fallback to initialPlatform
      )

      if (newConversation && newConversation.id) {
        await generateOnboardingAIResponse(newConversation.id, comment)
        setOpen(false)
        router.push(`/chat/${newConversation.id}`)
      } else {
        console.error("Failed to create conversation: No ID returned")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bonjour, je suis là pour vous aider ! Comment puis-je vous assister aujourd’hui ?</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Informations sur l'entreprise"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
          <Button className="bg-BakerLabButton" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer le guide"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

