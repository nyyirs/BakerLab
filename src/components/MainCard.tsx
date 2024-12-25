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

const CardSection = ({userData}:{userData: string}) => {
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
      // Add timeouts to prevent 504 errors
      const timeoutDuration = 60000; // 30 seconds

      // Create conversation with timeout
      const conversationPromise = createConversation(
        comment.trim().split(' ').slice(0, 3).join(' '),
        organisation,
        platform
      );
      const newConversation = await Promise.race([
        conversationPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Conversation creation timed out')), timeoutDuration)
        )
      ]);

      if (newConversation && newConversation.id) {
        // Generate AI response with timeout
        const aiResponsePromise = generateAIResponse(newConversation.id, comment);
        await Promise.race([
          aiResponsePromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI response generation timed out')), timeoutDuration)
          )
        ]);

        setOpen(false);
        router.push(`/chat/${newConversation.id}`);
      } else {
        console.error("Failed to create conversation: No ID returned");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error in conversation flow:", error);
      setIsLoading(false);
      // Handle timeout errors specifically
      if (error instanceof Error && error.message.includes('timed out')) {
        console.error("Request timed out - please try again");
      }
    }
  }

  const handleCardClick = (index: number) => {
      setOpen(true)
  }

  return (
    <>
      <Card className="col-span-full" x-chunk="dashboard-05-chunk-0">
        <CardHeader className="pb-3">
          <CardTitle>Bienvenue {userData.split("@")[0].toUpperCase()} dans votre Hub Assistant IA</CardTitle>
          <CardDescription className="text-balance w-full leading-relaxed">
            Accédez facilement à des outils d’Intelligence Artificielle conçus spécifiquement pour simplifier votre quotidien.
          </CardDescription>
        </CardHeader>
        <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-BakerLabButton">Créer un nouveau contenu</Button>
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
                  <SelectItem value="IGENSIA">IGENSIA</SelectItem>
                  <SelectItem value="ISCPA">ISCPA</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => setDropdownPlatform(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Votre contenu est destiné à" />
                </SelectTrigger>
                <SelectContent>
                  {organisation === "IGENSIA" ? (
                    <>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                    </>
                  ) : organisation === "ISCPA" ? (
                    <>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Site web">Site web</SelectItem>
                      <SelectItem value="Fiches metiers">Fiches métiers</SelectItem>
                    </>
                  ) : null}
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
      </CardFooter>
      </Card>

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
