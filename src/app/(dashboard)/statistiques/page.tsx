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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <ConversationStatsCard />
        </div>
        <div>
          <IterationStatsCard />
        </div>
        <div>
          <AverageTimeStatsCard />
        </div>
        <div>
          <AverageRequestStatsCard />
        </div>
        <div>
          <TotalGeneratedContentCard />
        </div>
      </div>
    </div>
  )
}

