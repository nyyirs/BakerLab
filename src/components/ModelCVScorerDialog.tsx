"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createConversation, generateCVAIResponse } from "@/action/chat"
import FileInputButton from "@/components/ui/file-input-button"

interface CVScorerDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  initialPlatform: string
}

export const CVScorerDialog: React.FC<CVScorerDialogProps> = ({ open, setOpen, initialPlatform }) => {
  const [cvFile, setCvFile] = useState<File | null>(null)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [comment, setComment] = useState("")
  const [platform, setPlatform] = useState(initialPlatform)

  useEffect(() => {
    setPlatform(initialPlatform)
  }, [initialPlatform])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCvFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const newConversation = await createConversation(
        "Scoreur de CVs",
        "BakerLab",
        "CV", // Use platform state, fallback to initialPlatform
      )

      if (newConversation && newConversation.id) {
        await generateCVAIResponse(newConversation.id, comment)
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
          <DialogTitle>Scoreur de CVs</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Charger la fiche de poste à analyser</label>
            <FileInputButton accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} buttonText="Importer un fichier" multiple={false} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Charger les CVs à analyser</label>
            <FileInputButton accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} buttonText="Importer un fichier" multiple={true} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Saisir les compétences à prioriser (optionnel)</label>
            <Input type="text" placeholder="Ex: anglais, management, marketing digital..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre de profils à ressortir</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un nombre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-BakerLabButton" onClick={handleSubmit} disabled={isLoading || !cvFile}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              "Analyser les CVs"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

