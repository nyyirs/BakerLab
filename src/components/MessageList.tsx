"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Document, Footer, ImageRun, Packer, Paragraph, TextRun } from "docx"
import { saveAs } from "file-saver"
import { ArrowDownToLine, Bot, Copy, User } from "lucide-react"
import { useEffect, useRef } from "react"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export default function MessageList({
  brand,
  messages,
  isLoading,
}: {
  messages: Message[]
  brand: string
  isLoading: boolean
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadAsWord = async (content: string) => {
    const lines = content.split("\n")
    const paragraphs: Paragraph[] = []
    const title = brand
    brand = "bakerpark"

    const brandName = brand.toLowerCase().trim().replace(/\s+/g, "-")
    const response = await fetch(`/brand-logo/${brandName}.png`)
    const imageBuffer = await response.arrayBuffer()

    const image = new ImageRun({
      type: "jpg",
      data: imageBuffer,
      transformation: {
        width: 120,
        height: 64,
      },
    })

    lines.forEach((line) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        const titleText = line.replace(/\*\*/g, "")
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: titleText, bold: true, font: "Archivo" })],
            spacing: { after: 200 },
          }),
        )
      } else if (line.startsWith("- ")) {
        const listItemText = line.replace("- ", "")
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: listItemText, font: "Archivo" })],
            bullet: { level: 0 },
          }),
        )
      } else if (line.trim() === "---") {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: " ", break: 1 })],
          }),
        )
      } else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line, font: "Archivo" })],
            spacing: { after: 200 },
          }),
        )
      }
    })

    const doc = new Document({
      sections: [
        {
          children: paragraphs,
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [image],
                }),
              ],
            }),
          },
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Message ${title}.docx`)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const renderMessageContent = (content: string) => {
    if (
      content.includes(
        'Voici la vidéo générée avec l\'avatar de Léa pour votre fiche de poste "Alternance - BTS Marketing Digital"',
      )
    ) {
      const videoId = "1f-EdP9xPZJzI1XG-XEsxI5NZlK3Eg3Xj"
      return (
        <>
          <p className="text-sm whitespace-pre-wrap mb-2">{content}</p>
          <div className="relative w-full pt-[56.25%]">
            <iframe
              src={`https://drive.google.com/file/d/${videoId}/preview`}
              allow="autoplay"
              className="absolute top-0 left-0 w-full h-full"
            ></iframe>
          </div>
        </>
      )
    }
    return <p className="text-sm whitespace-pre-wrap">{content}</p>
  }

  return (
    <div className="flex-1 relative">
      <ScrollArea className="absolute inset-0">
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-end max-w-[70%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex items-center justify-center p-2 w-8 h-8 rounded-full ${
                    message.role === "user" ? "bg-IGSButton ml-2" : "bg-gray-300 mr-2"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    message.role === "user"
                      ? "bg-BakerLabBackground text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {renderMessageContent(message.content)}
                  {message.role === "assistant" && (
                    <div className="mt-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadAsWord(message.content)}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowDownToLine className="h-4 w-4 hover:text-IGSButton" />
                      </Button>{" "}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          copyToClipboard(message.content)
                        }}
                        className="h-8 w-8 p-0 ml-auto"
                      >
                        <Copy className="h-4 w-4 hover:text-BakerLabButton" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-end max-w-[70%] flex-row">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 mr-2">
                  <Bot className="h-5 w-5 text-gray-600" />
                </div>
                <div className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                  <p className="text-sm">
                    Thinking<span className="animate-pulse">...</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  )
}

