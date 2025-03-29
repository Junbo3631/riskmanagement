"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { calculateRiskScoreWithSQL } from "@/lib/risk-score-sql"

interface RiskScoreCalculatorButtonProps {
  facilityId: string
  onSuccess?: (data: any) => void
}

export function RiskScoreCalculatorButton({ facilityId, onSuccess }: RiskScoreCalculatorButtonProps) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = async () => {
    setIsCalculating(true)
    setError(null)

    try {
      const result = await calculateRiskScoreWithSQL(facilityId)
      console.log("リスクスコア計算結果:", result)

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      console.error("リスクスコア計算エラー:", err)
      setError(err instanceof Error ? err.message : "計算中にエラーが発生しました")
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleCalculate} disabled={isCalculating} className="w-full">
        {isCalculating ? "リスクスコア計算中..." : "SQLでリスクスコアを計算"}
      </Button>

      {error && <div className="text-sm text-red-500 p-2 bg-red-50 rounded">エラー: {error}</div>}
    </div>
  )
}

