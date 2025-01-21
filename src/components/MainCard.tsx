'use client'

import { createConversation, generateAIResponse } from '@/action/chat'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { useRouter } from 'next/navigation'
import { useState } from "react"
import Link from "next/link"
import ModelCardSection from "./ModelCardSection"

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
        <Link href="/model">
          <Button className="bg-BakerLabButton">Naviguer sur les différents modèles</Button>
        </Link>          
        </CardFooter>
      </Card>
      <ModelCardSection />
    </>
  )
}

export default CardSection
