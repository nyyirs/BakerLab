import { ConversationStatsCard } from '@/components/stats/ConversationStatsChart'
import { IterationStatsCard } from '@/components/stats/IterationStatsCard'
import { AverageTimeStatsCard } from '@/components/stats/AverageTimeStatsCard'
import { AverageRequestStatsCard } from '@/components/stats/AverageRequestStatsCard'
import { TotalGeneratedContentCard } from '@/components/stats/TotalGeneratedContentCard'

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>        
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1 md:col-span-2">
          <ConversationStatsCard />
        </div>
        <div className="col-span-1">
          <IterationStatsCard />
        </div>
        <div className="col-span-1">
          <AverageTimeStatsCard />
        </div>
        <div className="col-span-1">
          <AverageRequestStatsCard />
        </div>
        <div className="col-span-1">
          <TotalGeneratedContentCard />
        </div>
      </div>
    </div>
  )
}

