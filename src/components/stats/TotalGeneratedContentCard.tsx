'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTotalGeneratedContentStats } from '@/action/stats'
import { Loader2, FileText } from 'lucide-react'
import { ResponsiveContainer, RadialBarChart, RadialBar, Cell, Tooltip } from 'recharts'

type UserGeneratedContent = {
  userId: string
  email: string | null
  generatedContentCount: number
}

type TotalGeneratedContentStats = {
  totalGeneratedContent: number
  userStats: UserGeneratedContent[]
}

export function TotalGeneratedContentCard() {
  const [stats, setStats] = useState<TotalGeneratedContentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getTotalGeneratedContentStats()
        setStats(data)
      } catch (err) {
        setError('Failed to fetch total generated content stats')
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
        <CardTitle>Contenu Généré Total</CardTitle>
        <CardDescription>Nombre total de contenus générés pour tous les utilisateurs</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Généré</p>
                <p className="text-xl font-bold">{stats?.totalGeneratedContent}</p>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                innerRadius="30%" 
                outerRadius="100%" 
                data={stats?.userStats} 
                startAngle={0} 
                endAngle={360}
              >
                <RadialBar
                  minAngle={15}
                  background
                  clockWise={true}
                  dataKey="generatedContentCount"
                  label={{ fill: '#666', position: 'insideStart' }}
                >
                  {stats?.userStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={[
                        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
                        '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
                        '#E74C3C', '#2ECC71', '#F1C40F', '#1ABC9C'
                      ][index % 12]}
                    />
                  ))}
                </RadialBar>
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Détails par Utilisateur:</p>
            <div className="max-h-[200px] overflow-y-auto">
              {stats?.userStats.map((user, index) => (
                <div key={user.userId} className="flex justify-between items-center py-1">
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
                    <p className="text-sm truncate" style={{maxWidth: '200px'}}>
                      {user.email || 'Utilisateur sans email'}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {user.generatedContentCount} contenu{user.generatedContentCount !== 1 ? 's' : ''}
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

