import { getConversation } from '@/action/chat'
import ChatInterface from '@/components/ChatInterface'

export async function generateMetadata({ params }: { params: { id: string } }) {
  // You can add metadata generation logic here if needed
  return {
    title: `Chat ${params.id}`
  }
}

export default async function ChatPage({ params }: { params: { id: string } }) {
  const id = await params.id
  const conversation = await getConversation(id)
  const initialMessages = conversation.chats.map((chat: { role: string; content: string }) => ({
    role: chat.role as 'user' | 'assistant' | 'system',
    content: chat.content
  }))

  return (
    <div className="flex flex-col h-full">
      <ChatInterface 
        initialMessages={initialMessages} 
        brand={conversation.organisation} 
        conversationId={id}
      />
    </div>
  )
}