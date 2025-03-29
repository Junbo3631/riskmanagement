"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  getAssessmentById,
  fetchSections,
  calculateAndSaveRiskScore,
  getRiskRecommendations,
} from "@/lib/assessment-service"
import { calculateDetailedProgress } from "@/lib/progress-calculator"
import type { Section, Answer } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/header"
import { EvaluationCriteriaSection } from "@/components/evaluation-criteria-section"
import { AlertTriangle, FileText, ArrowRight, Badge } from "lucide-react"
import { RiskRecommendations } from "./risk-recommendations"
import { generateRiskRecommendations } from "@/lib/risk-recommendation"

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const [sections, setSections] = useState<Section[]>([])
  const [assessmentName, setAssessmentName] = useState<string>("")
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({})
  const [recommendations, setRecommendations] = useState<any>(null)

  const assessmentId = params.id as string

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // セクション一覧を取得
        const sectionsData = await fetchSections()
        setSections(sectionsData)

        // 評価データを取得
        const assessment = await getAssessmentById(assessmentId)
        if (assessment) {
          setAssessmentName(assessment.name)
          setAssessmentData(assessment)

          // リスク推奨事項を取得
          const riskRecommendations = await getRiskRecommendations(assessmentId)
          if (riskRecommendations) {
            // assessmentDataにリスク推奨事項を追加
            setAssessmentData((prev) => ({
              ...prev,
              riskRecommendations,
            }))
          }

          // 回答データを配列形式に変換
          const answersArray: Answer[] = []

          // assessment.answersはセクションIDをキーとするオブジェクト
          Object.entries(assessment.answers).forEach(([sectionId, sectionAnswers]) => {
            // sectionAnswersは質問IDをキーとするオブジェクト
            Object.entries(sectionAnswers as Record<string, any>).forEach(([questionId, value]) => {
              answersArray.push({
                id: `${assessmentId}_${questionId}`,
                facility_id: assessmentId,
                question_id: Number(questionId),
                value: typeof value === "string" ? value : null,
                numeric_value: typeof value === "number" ? value : null,
                selected_options: Array.isArray(value) ? value : null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
            })
          })

          // 進捗状況を計算
          const { sectionProgress: calculatedProgress, overallProgress } = await calculateDetailedProgress(answersArray)

          // 進捗状況をセット
          const formattedProgress: Record<string, number> = {}
          Object.entries(calculatedProgress).forEach(([sectionId, progress]) => {
            formattedProgress[sectionId] = progress
          })

          setSectionProgress(formattedProgress)

          // リスク推奨事項を取得
          const recommendations = await generateRiskRecommendations(assessmentId)
          setRecommendations(recommendations)

          // デバッグ用：回答データをログに出力
          if (process.env.NODE_ENV === "development") {
            console.log("回答データ:", answersArray)
            console.log("計算された進捗状況:", calculatedProgress)
          }
        }
      } catch (err) {
        console.error("データ読み込みエラー:", err)
        setError("データの読み込み中にエラーが発生しました")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [assessmentId])

  const navigateToSection = (sectionId: number) => {
    router.push(`/assessment/${assessmentId}/section/${sectionId}`)
  }

  const calculateRiskScore = async () => {
    try {
      await calculateAndSaveRiskScore(assessmentId)
      alert("リスクスコアを計算しました")
    } catch (error) {
      console.error("リスクスコア計算エラー:", error)
      alert("リスクスコアの計算に失敗しました")
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">エラーが発生しました</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              <Button onClick={() => router.push("/")} className="mt-4">
                トップページに戻る
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{assessmentName || `評価 ${assessmentId}`}</h1>
          <Button variant="outline" onClick={() => router.push("/")}>
            ダッシュボードに戻る
          </Button>
        </div>

        {/* リスク評価カード - ページ幅に合わせる */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">リスク評価</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {/* 発生確率スコア */}
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">発生確率スコア</div>
                <div className="text-xl font-bold">
                  {assessmentData?.riskScore?.probabilityScore
                    ? Number(assessmentData?.riskScore?.probabilityScore).toFixed(1)
                    : "未評価"}
                </div>
              </div>

              {/* 影響度スコア */}
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">影響度スコア</div>
                <div className="text-xl font-bold">
                  {assessmentData?.riskScore?.impactScore
                    ? Number(assessmentData?.riskScore?.impactScore).toFixed(1)
                    : "未評価"}
                </div>
              </div>

              {/* 対策レベルスコア */}
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">対策レベルスコア</div>
                <div className="text-xl font-bold">
                  {assessmentData?.riskScore?.mitigationScore
                    ? Number(assessmentData?.riskScore?.mitigationScore).toFixed(1)
                    : "未評価"}
                </div>
              </div>

              {/* 総合リスクスコア */}
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">総合リスクスコア</div>
                <div className="text-xl font-bold">
                  {assessmentData?.riskScore?.totalScore
                    ? Number(assessmentData?.riskScore?.totalScore).toFixed(1)
                    : "未評価"}
                </div>
              </div>
            </div>

            {/* リスクレベル */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">リスクレベル</span>
              <Badge
                variant={
                  assessmentData?.riskScore?.riskLevel === "高"
                    ? "destructive"
                    : assessmentData?.riskScore?.riskLevel === "中"
                      ? "secondary"
                      : "default"
                }
              >
                {assessmentData?.riskScore?.riskLevel || "未評価"}
              </Badge>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              ※ 発生確率と影響度が高いほど、対策レベルが低いほどリスクが高くなります。
            </p>
          </CardContent>
        </Card>

        <div className="mt-6">
          <RiskRecommendations recommendations={recommendations} />
        </div>

        {/* セクション一覧 */}
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-foreground">評価セクション一覧</CardTitle>
            <CardDescription className="text-muted-foreground">
              各セクションを選択して質問に回答してください
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigateToSection(section.id)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      {section.name}
                    </h3>
                    <Button variant="ghost" size="sm" className="gap-1">
                      回答する <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-2">{section.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span>進捗状況: {sectionProgress[section.id] || 0}%</span>
                    <span className="text-xs text-muted-foreground">
                      {sectionProgress[section.id] === 100 ? "完了" : "未完了"}
                    </span>
                  </div>
                  <Progress value={sectionProgress[section.id] || 0} className="h-1 mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <EvaluationCriteriaSection />
    </div>
  )
}

