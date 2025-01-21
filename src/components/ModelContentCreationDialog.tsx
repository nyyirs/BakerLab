"use client"

import { createConversation, generateAIResponse } from "@/action/chat"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface ContentCreationDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  initialPlatform: string
}

export const ContentCreationDialog: React.FC<ContentCreationDialogProps> = ({ open, setOpen, initialPlatform }) => {
  const router = useRouter()
  const [organisation, setOrganisation] = useState("")
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
        organisation,
        platform || initialPlatform, // Use platform state, fallback to initialPlatform
      )

      if (newConversation && newConversation.id) {
        await generateAIResponse(newConversation.id, comment)
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
          <DialogTitle>Créer un nouveau contenu</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select onValueChange={(value) => setOrganisation(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Vous souhaitez créer un contenu pour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Baker Park">Baker Park</SelectItem>
              <SelectItem value="Baker Lab">Baker Lab</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Partagez avec nous une description claire et précise du contenu que vous souhaitez créer."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[150px]"
          />
          <Button className="bg-BakerLabButton" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              "Soumettre"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

