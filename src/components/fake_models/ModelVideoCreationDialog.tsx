"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createConversation, generateVideoAIResponse } from "@/action/chat"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VideoCreationDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  initialPlatform: string
}

export const VideoCreationDialog: React.FC<VideoCreationDialogProps> = ({ open, setOpen, initialPlatform }) => {
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
        "Vidéo", // Use platform state, fallback to initialPlatform
      )

      if (newConversation && newConversation.id) {
        await generateVideoAIResponse(newConversation.id, comment)
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
          <DialogTitle>Créer une vidéo avatarisée</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">L'avatar avec lequel vous souhaitez créer une vidéo "Fiche de poste"</label>
            <Select>  
              <SelectTrigger>
                <SelectValue placeholder="Choisissez un avatar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lea">Léa</SelectItem>
                <SelectItem value="max">Max</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quel est le script de votre avatar ?</label>
            <Textarea
              placeholder="Insérer ici le script de votre avatar, sans commentaire ni description"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <Button className="bg-BakerLabButton" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer la vidéo"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

