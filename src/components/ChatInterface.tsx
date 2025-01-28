'use client'

import { generateAIResponse, generateOnboardingAIResponse } from '@/action/chat'
import { useState } from "react"
import ChatInput from "./ChatInput"
import MessageList from "./MessageList"

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function ChatInterface({ initialMessages, brand, conversationId }: { initialMessages: Message[],brand: string, conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (inputMessage: string) => {
    if (inputMessage.trim() === "" || isLoading) return

    setIsLoading(true)
    const newUserMessage: Message = { role: "user", content: inputMessage }
    setMessages(prevMessages => [...prevMessages, newUserMessage])

    try {

      if (initialMessages[0].content === "Bonjour, je voudrais savoir comment demander des congés.") {
        const aiResponse = await generateOnboardingAIResponse(conversationId, inputMessage)
        const newAiMessage: Message = { role: "assistant", content: aiResponse as string }
        setMessages(prevMessages => [...prevMessages, newAiMessage])
      } else {
        const aiResponse = await generateAIResponse(conversationId, inputMessage)
        const newAiMessage: Message = { role: "assistant", content: aiResponse as string }
        setMessages(prevMessages => [...prevMessages, newAiMessage])
      }

    } catch (error) {
      console.error("Error generating AI response:", error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto">
        <MessageList messages={messages} brand={brand} isLoading={isLoading} />
      </div>
      <div className="mt-4 sticky bottom-0">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}