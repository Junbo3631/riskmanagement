import { Suspense } from "react"
import { getRiskScores, getIncidentCases } from "./actions"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskHeatmapClient } from "./risk-heatmap-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">リスクマネジメントダッシュボード</h1>

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <Suspense fallback={<HeatmapSkeleton />}>
              <DashboardContent />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function DashboardContent() {
  // デフォルトでは高リスクの事故事例を表示
  const initialRiskLevel = "high"
  const riskScores = await getRiskScores()
  const initialIncidents = await getIncidentCases(initialRiskLevel)

  return (
    <div className="space-y-8">
      <RiskHeatmapWrapper
        riskScores={riskScores}
        initialIncidents={initialIncidents}
        initialRiskLevel={initialRiskLevel}
      />
    </div>
  )
}

// クライアントコンポーネントをラップするためのサーバーコンポーネント
function RiskHeatmapWrapper({ riskScores, initialIncidents, initialRiskLevel }) {
  return (
    <RiskHeatmapClient
      riskScores={riskScores}
      initialIncidents={initialIncidents}
      initialRiskLevel={initialRiskLevel}
    />
  )
}

// スケルトンローディング状態
function HeatmapSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">リスクヒートマップ</h2>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">事故事例</h2>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

