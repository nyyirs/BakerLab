"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Cell, Pie, PieChart } from "recharts"

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-sm font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const completionData = [
  { name: "Questions répondue", value: 72 },
  { name: "Questions non répondue", value: 28 },
]

const topicsData = [
  { name: "Foire aux questions (FAQ)", value: 44 },
  { name: "Actualités et informations", value: 32 },
  { name: "Services aux salariés des TPE", value: 16 },
  { name: "Adhésion et abonnements", value: 8 },
]

const CustomLegend = ({ data, colors }: { data: any[]; colors: string[] }) => {
  return (
    <div className="flex flex-col gap-2 text-sm mt-4">
      {data.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors[index] }}
          />
          <span>{entry.name}</span>
        </div>
      ))}
    </div>
  )
}

export default function StatisticsCharts() {
  return (
    <>
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Taux de complétion des demandes clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <ChartContainer
              config={{
                answered: {
                  label: "Questions répondue",
                  color: "#2196f3",
                },
                unanswered: {
                  label: "Questions non répondue",
                  color: "#e91e63",
                },
              }}
              className="w-full aspect-[4/3]"
            >
              <PieChart>
                <Pie
                  data={completionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={0}
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {completionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#2196f3" : "#e91e63"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="absolute bottom-0 w-full flex justify-center">
              <CustomLegend
                data={completionData}
                colors={["#2196f3", "#e91e63"]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Thématiques des questions posées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <ChartContainer
              config={{
                faq: {
                  label: "Foire aux questions (FAQ)",
                  color: "#2196f3",
                },
                news: {
                  label: "Actualités et informations",
                  color: "#e91e63",
                },
                services: {
                  label: "Services aux salariés des TPE",
                  color: "#00bcd4",
                },
                membership: {
                  label: "Adhésion et abonnements",
                  color: "#03a9f4",
                },
              }}
              className="w-full aspect-[4/3]"
            >
              <PieChart>
                <Pie
                  data={topicsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={0}
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {topicsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? "#2196f3"
                          : index === 1
                          ? "#e91e63"
                          : index === 2
                          ? "#00bcd4"
                          : "#03a9f4"
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="absolute bottom-0 right-0">
              <CustomLegend
                data={topicsData}
                colors={["#2196f3", "#e91e63", "#00bcd4", "#03a9f4"]}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

