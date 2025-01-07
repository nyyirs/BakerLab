import StatsCharts from "@/components/StatsCharts"
import PopularQuestions from "@/components/StatsPopularQuestions"

export default function StatisticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Statistics Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <StatsCharts />
      </div>
      <PopularQuestions />
    </div>
  )
}

