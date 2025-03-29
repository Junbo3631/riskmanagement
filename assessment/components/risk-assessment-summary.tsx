"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, ShieldCheck, Zap, ArrowRight, AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  calculateAssessmentRiskScore,
  getRiskLevelBadgeVariant,
  RiskLevel,
  calculateSectionRiskScores,
  getSectionNameJa,
  calculateItemRiskScores,
} from "@/lib/risk-assessment"
import { getAssessmentRiskScore, calculateAndSaveRiskScore } from "@/lib/assessment-service"
import { setupSingleListener } from "@/lib/supabase-listener" // 新しいリスナー管理関数をインポート

interface RiskAssessmentSummaryProps {
  assessment: any
}

export function RiskAssessmentSummary({ assessment }: RiskAssessmentSummaryProps) {
  const [riskScore, setRiskScore] = useState({
    probabilityScore: 0,
    impactScore: 0,
    mitigationScore: 0,
    totalScore: 0,
    riskLevel: RiskLevel.High,
    sectionScores: {},
  })
  const [highRiskItems, setHighRiskItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Supabaseのサブスクリプションを保持するためのref
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  // コンポーネントがマウントされているかを追跡するref
  const isMountedRef = useRef(true)

  useEffect(() => {
    // コンポーネントがマウントされたことを記録
    isMountedRef.current = true

    async function loadRiskScore() {
      if (!assessment || !assessment.id || !isMountedRef.current) return

      setIsLoading(true)
      try {
        // Supabaseからリスクスコアを取得
        let scoreData = await getAssessmentRiskScore(assessment.id)

        // リスクスコアがない場合は計算して保存
        if (!scoreData) {
          await calculateAndSaveRiskScore(assessment.id)
          scoreData = await getAssessmentRiskScore(assessment.id)
        }

        // コンポーネントがまだマウントされていることを確認
        if (!isMountedRef.current) return

        // リスクスコアが取得できた場合
        if (scoreData) {
          const sectionScores = calculateSectionRiskScores(assessment)

          setRiskScore({
            ...scoreData,
            sectionScores,
          })
        } else {
          // フォールバック: クライアント側で計算
          const calculatedScore = calculateAssessmentRiskScore(assessment)
          const sectionScores = calculateSectionRiskScores(assessment)

          setRiskScore({
            ...calculatedScore,
            sectionScores,
          })
        }

        // 高リスク項目を計算
        const itemScores = calculateItemRiskScores(assessment)
        setHighRiskItems(itemScores.slice(0, 3)) // 上位3つを取得
      } catch (error) {
        console.error("リスクスコア読み込みエラー:", error)

        // コンポーネントがまだマウントされていることを確認
        if (!isMountedRef.current) return

        // エラー時はクライアント側で計算
        const calculatedScore = calculateAssessmentRiskScore(assessment)
        const sectionScores = calculateSectionRiskScores(assessment)

        setRiskScore({
          ...calculatedScore,
          sectionScores,
        })

        const itemScores = calculateItemRiskScores(assessment)
        setHighRiskItems(itemScores.slice(0, 3))
      } finally {
        // コンポーネントがまだマウントされていることを確認
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    loadRiskScore()

    // 既存のサブスクリプションがあれば解除
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe()
      } catch (e) {
        console.error("サブスクリプション解除エラー:", e)
      }
      subscriptionRef.current = null
    }

    // 単一のリスナーを設定
    if (assessment?.id) {
      const listenerKey = `risk-summary-${assessment.id}`

      // リスクスコアと回答の両方の変更を監視する単一のリスナーを設定
      subscriptionRef.current = setupSingleListener(
        listenerKey,
        "answers", // 回答テーブルの変更を監視
        { filter: `facility_id=eq.${assessment.id}` },
        (payload) => {
          // データが変更されたら再読み込み（同期的に実行）
          console.log("RiskAssessmentSummary: リスナーからのコールバックを実行:", payload)
          if (isMountedRef.current) {
            // 非同期処理を避けるため、setTimeout を使用
            setTimeout(() => {
              if (isMountedRef.current) {
                loadRiskScore()
              }
            }, 0)
          }
          // 非同期応答を示さないよう、trueを返さない
          return undefined
        },
      )
    }

    // クリーンアップ関数
    return () => {
      console.log("RiskAssessmentSummary: コンポーネントのアンマウント - リスナーを解除します")
      // コンポーネントがアンマウントされたことを記録
      isMountedRef.current = false

      // サブスクリプションを解除
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe()
          console.log("リスナーを正常に解除しました")
        } catch (e) {
          console.error("サブスクリプション解除エラー:", e)
        }
        subscriptionRef.current = null
      }
    }
  }, [assessment])

  // スコアを1-5のスケールから0-100のパーセンテージに変換
  const probabilityPercent = Math.min(100, Math.max(0, ((riskScore.probabilityScore - 1) / 4) * 100))
  const impactPercent = Math.min(100, Math.max(0, ((riskScore.impactScore - 1) / 4) * 100))
  const mitigationPercent = Math.min(100, Math.max(0, ((5 - riskScore.mitigationScore) / 4) * 100)) // 対策レベルは逆転（高いほど良い）

  // リスクレベルに応じたバッジのバリアントを取得
  const riskLevelBadgeVariant = getRiskLevelBadgeVariant(riskScore.riskLevel as RiskLevel)

  // リスクレベルに応じたテキスト色を設定
  const getBadgeTextColor = () => {
    switch (riskScore.riskLevel) {
      case RiskLevel.Low:
        return "text-green-900 font-bold" // 低リスク: 濃い緑色
      case RiskLevel.Medium:
        return "text-amber-900 font-bold" // 中リスク: 濃い琥珀色
      case RiskLevel.High:
        return "text-white font-bold" // 高リスク: 白色
      default:
        return "text-foreground font-bold"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>リスク評価サマリー</CardTitle>
          <CardDescription>リスクスコアを計算中...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="animate-pulse">データを読み込んでいます...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>リスク評価サマリー</CardTitle>
          <Badge variant={riskLevelBadgeVariant} className="px-3 py-1">
            <span className="text-foreground">リスクレベル: </span>
            <span className={`ml-1 ${getBadgeTextColor()}`}>{riskScore.riskLevel}</span>
          </Badge>
        </div>
        <CardDescription>
          総合リスクスコア: <span className="font-bold">{riskScore.totalScore.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 最優先改善事項 */}
        {
          <div className="mb-6 p-4 border rounded-md bg-amber-50 border-amber-200">
            <h3 className="text-sm font-medium flex items-center mb-3 text-amber-800">
              <AlertCircle className="mr-2 h-4 w-4 text-amber-600" />
              最優先改善事項
            </h3>
            {highRiskItems.length > 0 ? (
              <div className="space-y-3">
                {highRiskItems.map((item, index) => (
                  <div key={index} className="border-b border-amber-100 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-900">
                          {index + 1}. {item.questionLabel}
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {item.sectionName} | 現在の状態: {item.answerLabel}
                        </p>
                      </div>
                      <Badge variant={getRiskLevelBadgeVariant(item.riskLevel)} className="ml-2">
                        {item.riskLevel}
                      </Badge>
                    </div>
                    {item.improvementSuggestion && (
                      <div className="mt-2 flex items-start">
                        <ArrowRight className="h-3 w-3 text-amber-600 mt-0.5 mr-1 flex-shrink-0" />
                        <p className="text-xs text-amber-800">{item.improvementSuggestion}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-800">高リスク項目が見つかりません。評価を進めると表示されます。</p>
            )}
          </div>
        }

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">発生確率</span>
            </div>
            <span className="text-sm">{riskScore.probabilityScore.toFixed(1)}/5</span>
          </div>
          <Progress value={probabilityPercent} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">影響度</span>
            </div>
            <span className="text-sm">{riskScore.impactScore.toFixed(1)}/5</span>
          </div>
          <Progress value={impactPercent} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">対策レベル</span>
            </div>
            <span className="text-sm">{riskScore.mitigationScore.toFixed(1)}/5</span>
          </div>
          <Progress value={mitigationPercent} className="h-2" />
        </div>

        {/* セクションごとのリスクスコア */}
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">セクションごとのリスク評価</h3>
          <div className="space-y-2">
            {Object.entries(riskScore.sectionScores || {}).map(([sectionId, sectionScore]: [string, any]) => (
              <div key={sectionId} className="rounded-md border p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{getSectionNameJa(sectionId)}</span>
                  <Badge variant={getRiskLevelBadgeVariant(sectionScore.riskLevel)} className="text-xs">
                    {sectionScore.riskLevel}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  スコア: {sectionScore.sectionScore.toFixed(2)}
                  <span className="mx-1">|</span>
                  発生確率: {sectionScore.probabilityScore.toFixed(1)}
                  <span className="mx-1">|</span>
                  影響度: {sectionScore.impactScore.toFixed(1)}
                  <span className="mx-1">|</span>
                  対策: {sectionScore.mitigationScore.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-md bg-muted p-3 text-sm">
          <p className="font-medium">リスクスコア計算式:</p>
          <p className="mt-1">
            総合リスクスコア = (発生確率 × 影響度) ÷ 対策レベル = ({riskScore.probabilityScore.toFixed(1)} ×{" "}
            {riskScore.impactScore.toFixed(1)}) ÷ {riskScore.mitigationScore.toFixed(1)} ={" "}
            {riskScore.totalScore.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

