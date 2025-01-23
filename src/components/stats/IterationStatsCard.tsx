'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getIterationStats } from '@/action/stats'
import { Loader2, BarChart2 } from 'lucide-react'
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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
    <Card className="w-full max-w-3xl mx-auto h-[550px]">
      <CardHeader>
        <CardTitle>Statistiques d'Itérations</CardTitle>
        <CardDescription>Nombre d'itérations avant d'obtenir un résultat final</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BarChart2 className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm font-medium">Moyenne d'Itérations</p>
                <p className="text-xl font-bold">{stats?.averageIterations.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-12">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.conversations}
                  dataKey="iterationCount"
                  nameKey="title"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({iterationCount}) => `${iterationCount}`}
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
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-[700px] space-y-2 my-auto">
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
                    <p className="text-sm truncate" style={{maxWidth: '200px'}}>{conv.title}</p>
                  </div>
                  <p className="text-sm font-medium">
                    {conv.iterationCount} itérations
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

