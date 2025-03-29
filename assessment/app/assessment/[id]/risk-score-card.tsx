import type React from "react"

interface RiskScoreCardProps {
  riskScore: number | null
}

const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ riskScore }) => {
  return (
    <div className="border rounded-md p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-2">リスクスコア</h3>
      <div className="text-3xl font-bold">{riskScore !== null ? `${Math.round(riskScore)}` : "計算中..."}</div>
    </div>
  )
}

export default RiskScoreCard

