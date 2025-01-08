'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getIterationStats } from '@/action/stats'
import { Loader2, BarChart2 } from 'lucide-react'

type IterationStat = {
  conversationId: string
  title: string
  iterationCount: number
}

type IterationStats = {
  userId: string
  conversations: IterationStat[]
  averageIterations: number
}

export function IterationStatsCard() {
  const [stats, setStats] = useState<IterationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getIterationStats()
        setStats(data)
      } catch (err) {
        setError('Failed to fetch iteration stats')
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
        <CardTitle>Statistiques d'Itérations</CardTitle>
      <CardDescription>Nombre d'itérations avant d'obtenir un résultat final</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BarChart2 className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm font-medium">Moyenne d'Itérations</p>
                <p className="text-xl font-bold">{stats?.averageIterations.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Détails par Conversation:</p>
            {stats?.conversations.map((conv) => (
              <div key={conv.conversationId} className="flex justify-between items-center">
                <p className="text-sm truncate" style={{maxWidth: '200px'}}>{conv.title}</p>
                <p className="text-sm font-medium">
                  {conv.iterationCount} itérations
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

