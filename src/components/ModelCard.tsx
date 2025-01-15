'use client'

import { createConversation, generateAIResponse } from '@/action/chat'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Image, Languages, Loader2 } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from "react"

const CardSection = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [organisation, setDropdownOrganisation] = useState("")
  const [platform, setDropdownPlatform] = useState("")
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Create a new conversation using the form data
      const newConversation = await createConversation(
        comment.trim().split(' ').slice(0, 3).join(' '),
        organisation,
        platform
      );

      if (newConversation && newConversation.id) {
        // Generate an AI response (this will also add the user's message)
        await generateAIResponse(newConversation.id, comment);

        // Close the dialog
        setOpen(false);

        // Navigate to the new chat
        router.push(`/chat/${newConversation.id}`);
      } else {
        console.error("Failed to create conversation: No ID returned");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      setIsLoading(false);
      // You may want to show an error message to the user here
    }
  }

  const handleCardClick = (index: number) => {
    setOpen(true)
    switch(index) {
      case 0: // "Rédiger un article de blog"
        setDropdownPlatform("Article")
        break
      case 1: // "Créer un post LinkedIn"
        setDropdownPlatform("LinkedIn")
        break
      case 2: // "Traduction par IA"
        setDropdownPlatform("Image")
        break
    }
  }

  return (
    <>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau contenu</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Select onValueChange={(value) => setDropdownOrganisation(value)}>
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
              <Button
                className="bg-BakerLabButton"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  'Soumettre'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {[
        { icon: FileText, title: "Rédiger un article de blog", model: "Modèle simple", disabled: false, description: "Obtenez un article structuré et pertinent adapté à votre audience." },
        { icon: Image, title: "Créer un post LinkedIn", model: "Modèle simple", disabled: false, description: "Générez un post engageant et professionnel prêt à publier." },
        { icon: Languages, title: "Traduction par IA", model: "Modèle avancé", disabled: true },
      ].map((feature, index) => (
      <Card
        key={index}
        className={`transition-all duration-300 ease-in-out ${feature.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-BakerLabButton hover:cursor-pointer'}`}
        onClick={() => handleCardClick(index)}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <feature.icon className={`w-6 h-6 ${feature.disabled ? 'text-gray-400' : 'text-BakerLabButton'}`} />
            <span>{feature.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{feature.model}</p>
          <h3 className="mt-2 font-semibold text-xl">{feature.title}</h3>
          <p className="mt-2 text-sm">
            {feature.disabled ? 'Cette fonctionnalité est actuellement indisponible.' : feature.description || 'Vous avez besoin de générer du texte pour vos emails, vos réseaux sociaux dans la tonalité de votre marque.'}
          </p>
        </CardContent>
      </Card>
    ))}
  </>
  )
}

export default CardSection
