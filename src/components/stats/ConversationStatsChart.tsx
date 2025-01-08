'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getConversationStats } from '@/action/stats'
import { User, MessageSquare } from 'lucide-react'

type ConversationStat = {
  userId: string
  email: string | null
  conversationCount: number
}

export function ConversationStatsCard() {
  const [stats, setStats] = useState<ConversationStat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getConversationStats()
        setStats(data)
      } catch (err) {
        setError('Failed to fetch conversation stats')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center">Loading stats...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">          
          <div className="flex items-center space-x-4">
            <MessageSquare className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm font-medium">Nombre de conversations</p>
              <p className="text-xl font-bold">{stats?.conversationCount || 0}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

