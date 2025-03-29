"use client"

import { useState } from "react"
import type { RiskScore } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface RiskHeatmapProps {
  riskScores: RiskScore[]
  onViewIncidents: (riskLevel: string) => void
}

export function RiskHeatmap({ riskScores, onViewIncidents }: RiskHeatmapProps) {
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | null>(null)

  // 施設とリスク評価項目の一覧を取得
  const facilities = [...new Set(riskScores.map((score) => score.facility_name))]
  const riskCategories = [...new Set(riskScores.map((score) => score.risk_category))]

  // リスクレベルに応じた背景色を取得
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-[#F0FDF4]"
      case "medium":
        return "bg-[#FEFCE8]"
      case "high":
        return "bg-[#FEF2F2]"
      case "none":
        return "bg-gray-50"
      default:
        return "bg-white"
    }
  }

  // リスクレベルに応じたテキスト色を取得
  const getRiskLevelTextColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-green-800"
      case "medium":
        return "text-yellow-800"
      case "high":
        return "text-red-800"
      case "none":
        return "text-gray-500"
      default:
        return "text-gray-800"
    }
  }

  // 施設ごとの最大リスクレベルを取得
  const getFacilityMaxRiskLevel = (facilityName: string) => {
    const facilityScores = riskScores.filter((s) => s.facility_name === facilityName && s.risk_level !== "none")

    if (facilityScores.some((s) => s.risk_level === "high")) {
      return "high"
    } else if (facilityScores.some((s) => s.risk_level === "medium")) {
      return "medium"
    } else if (facilityScores.some((s) => s.risk_level === "low")) {
      return "low"
    }

    return "none" // すべてのスコアがnoneの場合
  }

  // 事故事例を表示する
  const handleViewIncidents = (riskLevel: string) => {
    if (riskLevel === "none") {
      // noneの場合は何もしない
      return
    }

    setSelectedRiskLevel(riskLevel)
    onViewIncidents(riskLevel)
  }

  return (
    <div className="overflow-auto">
      <h2 className="text-xl font-bold mb-4">リスクヒートマップ</h2>
      <div className="flex">
        <div className="flex flex-col">
          <div className="h-10 w-40 flex items-center justify-center font-bold border-b">施設 / リスク評価項目</div>
          {facilities.map((facility) => (
            <div key={facility} className="h-10 w-40 flex items-center px-2 border-b">
              {facility}
            </div>
          ))}
        </div>
        <div className="flex flex-1 overflow-x-auto">
          <div className="flex flex-col">
            <div className="flex">
              {riskCategories.map((category) => (
                <div key={category} className="h-10 w-32 flex items-center justify-center font-bold border-b border-r">
                  {category}
                </div>
              ))}
              <div className="h-10 w-40 flex items-center justify-center font-bold border-b border-r">アクション</div>
            </div>
            {facilities.map((facility) => (
              <div key={facility} className="flex">
                {riskCategories.map((category) => {
                  const score = riskScores.find((s) => s.facility_name === facility && s.risk_category === category)

                  // スコアがない場合はデフォルト値を使用
                  const riskLevel = score?.risk_level || "none"

                  // スコアが-1の場合は「N/A」と表示
                  const displayScore = score?.risk_score === -1 ? "N/A" : score?.risk_score.toFixed(2) || "N/A"

                  return (
                    <div
                      key={`${facility}-${category}`}
                      className={`h-10 w-32 flex items-center justify-center border-b border-r ${getRiskLevelColor(riskLevel)}`}
                    >
                      <span className={`font-medium ${getRiskLevelTextColor(riskLevel)}`}>{displayScore}</span>
                    </div>
                  )
                })}
                <div className="h-10 w-40 flex items-center justify-center border-b border-r">
                  {/* 施設ごとの最大リスクレベルを取得 */}
                  {(() => {
                    const maxRiskLevel = getFacilityMaxRiskLevel(facility)

                    // リスクレベルがnoneの場合はボタンを無効化
                    if (maxRiskLevel === "none") {
                      return (
                        <Button variant="outline" size="sm" disabled>
                          データなし
                        </Button>
                      )
                    }

                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${selectedRiskLevel === maxRiskLevel ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() => handleViewIncidents(maxRiskLevel)}
                      >
                        事故事例を見る
                      </Button>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#F0FDF4] border mr-2"></div>
          <span>低リスク (1.0未満)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#FEFCE8] border mr-2"></div>
          <span>中リスク (1.0〜2.0)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#FEF2F2] border mr-2"></div>
          <span>高リスク (2.0以上)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-50 border mr-2"></div>
          <span>データなし</span>
        </div>
      </div>
    </div>
  )
}

