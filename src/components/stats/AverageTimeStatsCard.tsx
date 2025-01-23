'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAverageTimeStats } from '@/action/stats'
import { Loader2, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type ConversationTime = {
  conversationId: string
  title: string
  duration: number
  durationInMinutes: number
}

type AverageTimeStats = {
  userId: string
  conversations: ConversationTime[]
  averageDurationMs: number
  averageDurationMinutes: number
}

export function AverageTimeStatsCard() {
  const [stats, setStats] = useState<AverageTimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getAverageTimeStats()
        setStats(data)
      } catch (err) {
        setError('Failed to fetch average time stats')
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
    <Card className="w-full max-w-3xl mx-auto h-[550px]">
      <CardHeader>
        <CardTitle>Temps Moyen pour un Résultat Final</CardTitle>
        <CardDescription>Durée moyenne pour aboutir à un résultat final par conversation</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm font-medium">Temps Moyen</p>
                <p className="text-xl font-bold">{stats?.averageDurationMinutes} minutes</p>
              </div>
            </div>
          </div>

          <div className="flex gap-12">
            <div className="h-[300px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.conversations}>
                  <XAxis 
                    dataKey="title"
                    tick={false}
                    height={0}
                  />
                  <YAxis 
                    dataKey="durationInMinutes"
                    name="Minutes"
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="durationInMinutes" 
                    fill="#2563eb"
                    name="Minutes"
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

            <div className="w-[300px] space-y-2 my-auto">
              <p className="font-medium">Détails par Conversation:</p>
              <div className="max-h-[300px] overflow-y-auto">
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
                      <p className="text-sm truncate" style={{maxWidth: '180px'}}>{conv.title}</p>
                    </div>
                    <p className="text-sm font-medium">
                      {conv.durationInMinutes} minutes
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

