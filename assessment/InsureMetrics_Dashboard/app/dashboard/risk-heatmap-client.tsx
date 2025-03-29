"use client"

import { useState } from "react"
import { RiskHeatmap } from "@/components/risk-heatmap"
import { IncidentCases } from "@/components/incident-cases"
import { Skeleton } from "@/components/ui/skeleton"
import { getIncidentCases } from "./actions"

interface RiskHeatmapClientProps {
  riskScores: any[]
  initialIncidents: any[]
  initialRiskLevel: string
}

export function RiskHeatmapClient({ riskScores, initialIncidents, initialRiskLevel }: RiskHeatmapClientProps) {
  const [incidents, setIncidents] = useState(initialIncidents)
  const [riskLevel, setRiskLevel] = useState(initialRiskLevel)
  const [loading, setLoading] = useState(false)

  const handleViewIncidents = async (level: string) => {
    setLoading(true)
    try {
      const newIncidents = await getIncidentCases(level)
      setIncidents(newIncidents)
      setRiskLevel(level)
    } catch (error) {
      console.error("事故事例の取得に失敗しました:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <RiskHeatmap riskScores={riskScores} onViewIncidents={handleViewIncidents} />

      {loading ? (
        <div className="space-y-2 mt-8">
          <h2 className="text-xl font-bold mb-4">事故事例を読み込み中...</h2>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <IncidentCases incidents={incidents} riskLevel={riskLevel} />
        </div>
      )}
    </>
  )
}

