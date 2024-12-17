'use client'

import React, { useState } from "react"
import { CornerDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ChatInput({ onSendMessage, isLoading }: { onSendMessage: (message: string) => void, isLoading: boolean }) {
  const [inputMessage, setInputMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() === "" || isLoading) return
    onSendMessage(inputMessage)
    setInputMessage("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mt-4 overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
    >
      <Label htmlFor="message" className="sr-only">
        Message
      </Label>
      <Textarea
        id="message"
        placeholder="Type your message here..."
        className="min-h-12 w-full resize-none border-0 bg-transparent p-3 shadow-none focus-visible:ring-0"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        disabled={isLoading}
      />
      <div className="absolute bottom-0 right-0 p-3">
        <Button type="submit" size="sm" className="gap-1.5 bg-BakerLabButton" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Message'}
          <CornerDownLeft className="size-3.5" />
        </Button>
      </div>
    </form>
  )
}