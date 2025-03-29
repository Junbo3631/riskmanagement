"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { validateHiroshimaRiskScore } from "@/lib/risk-score-validator"
import { Header } from "@/components/header"

export default function RiskScoreValidatorPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function validateRiskScore() {
    setLoading(true)
    setError(null)

    try {
      const validationResult = await validateHiroshimaRiskScore()
      setResult(validationResult)
    } catch (err) {
      console.error("Validation error:", err)
      setError(err instanceof Error ? err.message : "リスクスコアの検証中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Header />
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">リスクスコア検証ツール</h1>
        <p className="text-gray-600">広島データセンターのリスクスコアを検証し、計算結果と現在のスコアを比較します。</p>
      </div>

      <div className="mb-6">
        <Button onClick={validateRiskScore} disabled={loading}>
          {loading ? "検証中..." : "リスクスコアを検証"}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>検証結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">現在のスコア</p>
                  <p className="text-2xl font-bold">
                    {result.currentScore ? result.currentScore.total_score : "未設定"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">計算されたスコア</p>
                  <p className="text-2xl font-bold">{result.calculatedScore.totalScore}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">差異</p>
                  <p className={`text-xl font-bold ${result.isMatching ? "text-green-500" : "text-red-500"}`}>
                    {result.currentScore
                      ? `${result.calculatedScore.totalScore - result.currentScore.total_score} ポイント`
                      : "比較不可"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>セクション別スコア</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(result.sectionScores).map(([sectionId, score]) => (
                  <div key={sectionId} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        セクション {sectionId}:{" "}
                        {{
                          "1": "基本情報",
                          "2": "物理的セキュリティ",
                          "3": "環境リスク",
                          "4": "運用管理",
                          "5": "事業継続性",
                        }[sectionId] || `セクション ${sectionId}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        重み:{" "}
                        {{
                          "1": "10%",
                          "2": "25%",
                          "3": "30%",
                          "4": "20%",
                          "5": "15%",
                        }[sectionId] || "不明"}
                      </p>
                    </div>
                    <p className="text-xl font-bold">{score}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>詳細情報</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

