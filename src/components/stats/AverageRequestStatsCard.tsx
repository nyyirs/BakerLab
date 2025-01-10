'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAverageRequestStats } from '@/action/stats'
import { Loader2, MessageSquare } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type ConversationRequests = {
  conversationId: string
  title: string
  requestCount: number
}

type AverageRequestStats = {
  userId: string
  conversations: ConversationRequests[]
  totalRequests: number
  averageRequests: number
}

export function AverageRequestStatsCard() {
  const [stats, setStats] = useState<AverageRequestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getAverageRequestStats()
        setStats(data)
      } catch (err) {
        setError('Failed to fetch average request stats')
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
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
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
      <CardHeader>
        <CardTitle>Nombre Moyen de Requêtes</CardTitle>
        <CardDescription>Nombre moyen de requêtes par conversation</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <MessageSquare className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm font-medium">Moyenne de Requêtes</p>
                <p className="text-xl font-bold">{stats?.averageRequests.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Total des Requêtes</p>
              <p className="text-lg font-semibold">{stats?.totalRequests}</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.conversations}>
                <XAxis 
                  dataKey="title"
                  tick={false}
                  height={0}
                />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="requestCount" 
                  fill="#2563eb"
                  name="Requêtes"
                  radius={[4, 4, 0, 0]}
                >
                  {stats?.conversations.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={[
                        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
                        '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
                        '#E74C3C', '#2ECC71', '#F1C40F', '#1ABC9C'
                      ][index % 12]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Détails par Conversation:</p>
            <div className="max-h-[200px] overflow-y-auto">
              {stats?.conversations.map((conv, index) => (
                <div key={conv.conversationId} className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{
                        backgroundColor: [
                          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
                          '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
                          '#E74C3C', '#2ECC71', '#F1C40F', '#1ABC9C'
                        ][index % 12]
                      }}
                    />
                    <p className="text-sm truncate" style={{maxWidth: '200px'}}>{conv.title}</p>
                  </div>
                  <p className="text-sm font-medium">
                    {conv.requestCount} requête{conv.requestCount !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

