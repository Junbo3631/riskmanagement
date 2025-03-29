"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, FileUp, Building2, Clock, AlertTriangle, RefreshCw, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecentAssessments } from "@/components/recent-assessments"
import { ImportAssessmentDialog } from "@/components/import-assessment-dialog"
import { calculateAssessmentRiskScore } from "@/lib/risk-assessment"

// 既存のimportを保持しつつ、以下を追加
import { Header } from "@/components/header"
import { EvaluationCriteriaSection } from "@/components/evaluation-criteria-section"
import { getAllUserAssessments } from "@/lib/assessment-service"
import { useRouter } from "next/navigation"
import { createAssessment } from "@/lib/assessment-service"

// ダッシュボードの統計情報を計算する関数
function calculateDashboardStats(assessments: any[]) {
  // 初期値を設定
  const stats = {
    totalCount: 0,
    inProgressCount: 0,
    highRiskCount: 0,
    averageScore: 0,
    recentAssessments: [] as any[],
  }

  if (!assessments || assessments.length === 0) {
    return stats
  }

  // 総評価数
  stats.totalCount = assessments.length

  // 進行中の評価数（進捗が100%未満のもの）
  stats.inProgressCount = assessments.filter((a) => a.progress < 100).length

  // 高リスク施設数
  stats.highRiskCount = assessments.filter((a) => {
    // 進捗が0%の場合は「未回答」として扱い、高リスクにはカウントしない
    if (a.progress === 0) {
      return false
    }

    // リスクスコアが高い場合
    if (a.riskScore && a.riskScore.riskLevel === "高") {
      return true
    }

    // 各セクションの進捗状況を確認
    const buildingStructureAnswers = a.answers["building-structure"] || {}
    const facilityEquipmentAnswers = a.answers["facility-equipment"] || {}
    const disasterRiskAnswers = a.answers["disaster-risk"] || {}

    // 建物構造と設備構造の両方が未完了、または災害リスクが未評価の場合は高リスク
    const buildingStructureIncomplete = Object.keys(buildingStructureAnswers).length === 0
    const facilityEquipmentIncomplete = Object.keys(facilityEquipmentAnswers).length === 0
    const disasterRiskIncomplete = Object.keys(disasterRiskAnswers).length === 0

    return (buildingStructureIncomplete && facilityEquipmentIncomplete) || disasterRiskIncomplete
  }).length

  // 平均リスクスコア（総合リスクスコアの平均）
  let totalRiskScore = 0
  let validAssessments = 0
  assessments.forEach((assessment) => {
    if (assessment.riskScore && !isNaN(assessment.riskScore.totalScore)) {
      totalRiskScore += assessment.riskScore.totalScore
      validAssessments++
    } else {
      try {
        const riskScoreResult = calculateAssessmentRiskScore(assessment)
        if (!isNaN(riskScoreResult.totalScore)) {
          totalRiskScore += riskScoreResult.totalScore
          validAssessments++
        }
      } catch (error) {
        console.error("リスクスコア計算エラー:", error)
      }
    }
  })
  stats.averageScore = validAssessments > 0 ? Math.round((totalRiskScore / validAssessments) * 100) / 100 : 0

  // 最近の評価（最新の2件）
  stats.recentAssessments = [...assessments]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 2)
    .map((a) => ({
      id: a.id,
      name: a.name,
      progress: a.progress || 0,
      updatedAt: formatLastUpdated(new Date(a.updatedAt)),
    }))

  return stats
}

// 最終更新日をフォーマットする関数
function formatLastUpdated(date: Date) {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "今日"
  } else if (diffDays === 1) {
    return "昨日"
  } else if (diffDays < 7) {
    return `${diffDays}日前`
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}週間前`
  } else {
    return `${Math.floor(diffDays / 30)}ヶ月前`
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalCount: 0,
    inProgressCount: 0,
    highRiskCount: 0,
    averageScore: 0,
    recentAssessments: [] as any[],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<any[]>([])

  // データを読み込む関数
  const loadAssessments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Supabaseからすべての評価データを読み込む
      const assessmentData = await getAllUserAssessments()
      console.log(`Supabaseから読み込んだ評価データ: ${assessmentData.length}件`)

      setAssessments(assessmentData)

      // ダッシュボードの統計情報を計算
      const calculatedStats = calculateDashboardStats(assessmentData)
      setStats(calculatedStats)
    } catch (error) {
      console.error("データの読み込みに失敗しました", error)
      setError("データの読み込みに失敗しました。ページを再読み込みしてください。")
    } finally {
      setIsLoading(false)
    }
  }

  // 初回読み込み
  useEffect(() => {
    loadAssessments()
  }, [])

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">データセンターリスク評価ダッシュボード</h1>
          <Button variant="outline" onClick={loadAssessments} disabled={isLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "データ読込中..." : "データを更新"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">データを読み込んでいます...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>エラー</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/new-assessment">
                  <Button className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    新規評価を作成
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">総評価数</CardTitle>
                  <Building2 className="h-4 w-4" style={{ color: "hsl(215, 50%, 35%)" }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.totalCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalCount > 0 ? "評価データが存在します" : "評価データがありません"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">進行中の評価</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: "hsl(215, 50%, 35%)" }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.inProgressCount}</div>
                  <p className="text-xs text-muted-foreground">
                    全体の {stats.totalCount > 0 ? Math.round((stats.inProgressCount / stats.totalCount) * 100) : 0}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">高リスク施設</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.highRiskCount}</div>
                  <p className="text-xs text-muted-foreground">
                    全体の {stats.totalCount > 0 ? Math.round((stats.highRiskCount / stats.totalCount) * 100) : 0}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">平均リスクスコア</CardTitle>
                  <Shield className="h-4 w-4" style={{ color: "hsl(215, 50%, 35%)" }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.averageScore}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalCount > 0 ? "リスクスコアの平均値" : "評価データがありません"}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Card>
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-foreground">データセンター評価一覧</CardTitle>
                  <CardDescription className="text-muted-foreground">進行中および完了した評価の一覧</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Tabs defaultValue="recent" className="space-y-4">
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="recent">最近の評価</TabsTrigger>
                      <TabsTrigger value="all">すべての評価</TabsTrigger>
                      <TabsTrigger value="archived">アーカイブ</TabsTrigger>
                    </TabsList>
                    <TabsContent value="recent" className="space-y-4">
                      <RecentAssessments assessmentList={assessments} />
                    </TabsContent>
                    <TabsContent value="all" className="space-y-4">
                      <RecentAssessments assessmentList={assessments} />
                    </TabsContent>
                    <TabsContent value="archived" className="space-y-4">
                      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">アーカイブされた評価はありません</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="border-t pt-3">
                  <Button variant="outline" className="mx-auto">
                    すべて表示
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-foreground">評価操作メニュー</CardTitle>
                  <CardDescription className="text-muted-foreground">新規評価の作成と最近の評価</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      className="w-full"
                      style={{ backgroundColor: "hsl(215, 50%, 35%)", color: "white" }}
                      onClick={async () => {
                        try {
                          // デフォルト名で新規評価を作成
                          const newAssessmentId = await createAssessment("新規データセンター評価")
                          // 作成した評価IDのページに遷移
                          router.push(`/assessment/${newAssessmentId}`)
                        } catch (error) {
                          console.error("新規評価の作成に失敗しました", error)
                          // エラー処理（必要に応じてトースト通知などを追加）
                        }
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      新規評価
                    </Button>

                    <ImportAssessmentDialog>
                      <Button variant="outline" className="w-full">
                        <FileUp className="mr-2 h-4 w-4" />
                        評価のインポート
                      </Button>
                    </ImportAssessmentDialog>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-foreground">最近の評価</h3>
                    {stats.recentAssessments.length === 0 ? (
                      <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground">最近の評価はありません</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stats.recentAssessments.map((assessment) => (
                          <div key={assessment.id} className="grid gap-1">
                            <div className="text-sm font-medium text-foreground">{assessment.name}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              <span>更新: {assessment.updatedAt}</span>
                              <span className="ml-auto">{assessment.progress}% 完了</span>
                            </div>
                            <Progress value={assessment.progress} className="h-1" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      <EvaluationCriteriaSection />
    </div>
  )
}

