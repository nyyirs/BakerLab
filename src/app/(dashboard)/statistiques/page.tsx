import { ConversationStatsCard } from '@/components/stats/ConversationStatsChart'
import { IterationStatsCard } from '@/components/stats/IterationStatsCard'
import { AverageTimeStatsCard } from '@/components/stats/AverageTimeStatsCard'

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
        <div className="max-w-2xl mx-auto">
          <p className="text-lg text-muted-foreground mb-6">🚧 Cette page est actuellement en cours de construction 🚧</p>
          <p className="text-muted-foreground mb-8">Notre équipe travaille activement sur la création d'un tableau de bord complet qui vous permettra de visualiser vos statistiques d'utilisation de manière claire et intuitive.</p>
          <div className="p-6 bg-muted rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Fonctionnalités à venir :</h2>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              <li className="flex items-center">
                <span className="mr-2">📊</span>
                <span>Statistiques détaillées des conversations</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">🔄</span>
                <span>Suivi des itérations par projet</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">⏱️</span>
                <span>Temps moyen de traitement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* <ConversationStatsCard /> */}
      {/* <IterationStatsCard /> */}
      {/* <AverageTimeStatsCard /> */}
    </div>
  )
}

