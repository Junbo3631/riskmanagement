"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RiskLevel } from "@/lib/risk-assessment"

interface RiskScoreDisplayProps {
  assessment: any
}

export function RiskScoreDisplay({ assessment }: RiskScoreDisplayProps) {
  // 完了率の計算
  const calculateCompletionRate = () => {
    if (!assessment.answers || Object.keys(assessment.answers).length === 0) {
      return { completed: 0, total: 0, answered: 0 }
    }

    let totalQuestions = 0
    let answeredQuestions = 0

    // 各セクションの回答を処理
    Object.values(assessment.answers).forEach((sectionAnswers: any) => {
      Object.entries(sectionAnswers).forEach(([key, value]) => {
        // 備考フィールドをスキップ
        if (key.includes("_notes")) return

        totalQuestions++

        // 回答がある場合
        if (value !== null && value !== undefined && value !== "") {
          answeredQuestions++
        }
      })
    })

    // 完了率を計算
    const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

    return {
      completed: completionRate,
      total: totalQuestions,
      answered: answeredQuestions,
    }
  }

  // リスクスコアの取得
  const getRiskScores = () => {
    // assessmentにriskScoreが含まれている場合はそれを使用
    if (assessment.riskScore) {
      return {
        probabilityScore: assessment.riskScore.probabilityScore || 0,
        impactScore: assessment.riskScore.impactScore || 0,
        mitigationScore: assessment.riskScore.mitigationScore || 0,
        totalScore: assessment.riskScore.totalScore || 0,
        riskLevel: assessment.riskScore.riskLevel || RiskLevel.Medium,
      }
    }

    // riskScoreがない場合はデフォルト値を返す
    return {
      probabilityScore: 0,
      impactScore: 0,
      mitigationScore: 0,
      totalScore: 0,
      riskLevel: RiskLevel.Medium,
    }
  }

  const { completed, total, answered } = calculateCompletionRate()
  const riskScores = getRiskScores()

  // リスクレベルに応じたバッジのバリアントを取得
  const getRiskLevelBadgeVariant = (riskLevel: string): "default" | "secondary" | "destructive" => {
    switch (riskLevel) {
      case "低":
        return "default"
      case "中":
        return "secondary"
      case "高":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const badgeVariant = getRiskLevelBadgeVariant(riskScores.riskLevel)

  return (
    <Card>
      <CardHeader>
        <CardTitle>リスク評価サマリー</CardTitle>
        <CardDescription>現在の評価状況とリスクレベルの概要</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 完了率 */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">完了率</span>
              <span className="text-sm font-medium">{Math.round(completed)}%</span>
            </div>
            <Progress value={completed} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {answered} / {total} 質問に回答済み
            </p>
          </div>

          {/* リスクレベル */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">リスクレベル</span>
            <Badge variant={badgeVariant}>{riskScores.riskLevel}</Badge>
          </div>

          {/* 4つのスコア */}
          <div className="grid grid-cols-2 gap-4">
            {/* 発生確率スコア */}
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">発生確率スコア</div>
              <div className="text-xl font-bold">{Math.round(riskScores.probabilityScore)}</div>
            </div>

            {/* 影響度スコア */}
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">影響度スコア</div>
              <div className="text-xl font-bold">{Math.round(riskScores.impactScore)}</div>
            </div>

            {/* 対策レベルスコア */}
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">対策レベルスコア</div>
              <div className="text-xl font-bold">{Math.round(riskScores.mitigationScore)}</div>
            </div>

            {/* 総合リスクスコア */}
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">総合リスクスコア</div>
              <div className="text-xl font-bold">{Math.round(riskScores.totalScore)}</div>
            </div>
          </div>

          {/* リスクスコアの説明 */}
          <div className="text-xs text-gray-500 mt-2">
            <p>※ 発生確率と影響度が高いほど、対策レベルが低いほどリスクが高くなります。</p>
            <p>※ 総合リスクスコアは発生確率×影響度÷対策レベルで計算されます。</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

