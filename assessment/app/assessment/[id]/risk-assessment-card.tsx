import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRiskScore } from "@/lib/assessment-service"
import { calculateAndSaveRiskScore } from "@/lib/risk-calculation"

// リスクレベルに応じた色を返す関数
function getRiskLevelColor(level: string) {
  switch (level?.toLowerCase()) {
    case "高":
      return "text-red-500"
    case "中":
      return "text-yellow-500"
    case "低":
      return "text-green-500"
    default:
      return "text-gray-500"
  }
}

// リスクスコアに応じた色を返す関数
function getRiskScoreColor(score: number) {
  if (score >= 4) return "text-red-500"
  if (score >= 2) return "text-yellow-500"
  return "text-green-500"
}

export async function RiskAssessmentCard({ assessmentId }: { assessmentId: string }) {
  console.log(`RiskAssessmentCard: 施設ID ${assessmentId} のリスク評価カードを表示します`)

  // まず、保存されているリスクスコアを取得
  let riskScoreData = await getRiskScore(assessmentId)

  // リスクスコアが存在しない場合は計算して保存
  if (!riskScoreData) {
    console.log(`RiskAssessmentCard: リスクスコアが見つからないため、計算します`)
    riskScoreData = await calculateAndSaveRiskScore(assessmentId)
  }

  console.log(`RiskAssessmentCard: リスクスコアデータ:`, riskScoreData)

  // リスクスコアが取得できなかった場合は空のカードを表示
  if (!riskScoreData) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>リスク評価</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">リスク評価データが利用できません</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>リスク評価</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium mb-2">発生確率</span>
            <span className={`text-3xl font-bold ${getRiskScoreColor(riskScoreData.probability_score)}`}>
              {riskScoreData.probability_score}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium mb-2">影響度</span>
            <span className={`text-3xl font-bold ${getRiskScoreColor(riskScoreData.impact_score)}`}>
              {riskScoreData.impact_score}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium mb-2">対策レベル</span>
            <span className={`text-3xl font-bold ${getRiskScoreColor(riskScoreData.mitigation_score)}`}>
              {riskScoreData.mitigation_score}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium mb-2">総合リスク</span>
            <div className="flex flex-col items-center">
              <span className={`text-3xl font-bold ${getRiskScoreColor(riskScoreData.total_score)}`}>
                {riskScoreData.total_score}
              </span>
              <span className={`text-sm font-medium mt-1 ${getRiskLevelColor(riskScoreData.risk_level)}`}>
                {riskScoreData.risk_level}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

