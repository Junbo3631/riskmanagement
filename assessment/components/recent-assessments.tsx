"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MoreHorizontal, Clock, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { allSections } from "@/lib/questions"

interface RecentAssessmentsProps {
  assessmentList?: any[]
}

export function RecentAssessments({ assessmentList = [] }: RecentAssessmentsProps) {
  const [formattedAssessments, setFormattedAssessments] = useState<any[]>([])

  useEffect(() => {
    if (assessmentList && assessmentList.length > 0) {
      const formatted = assessmentList.map((assessment) => {
        // 各セクションの進捗状況を計算
        const sectionProgress = calculateSectionProgress(assessment)

        // 全体の進捗状況を計算
        const overallProgress = assessment.progress || calculateOverallProgress(sectionProgress)

        // 完了したセクション数を計算
        const completedSections = Object.values(sectionProgress).filter((progress) => progress === 100).length

        // 必須セクションが完了しているかチェック
        const requiredSectionsCompleted = checkRequiredSectionsCompleted(sectionProgress)

        // ステータスを決定
        const status = determineStatus(overallProgress, completedSections, requiredSectionsCompleted)

        // 実際のセクション数を計算（セクションIDが数値のプロパティのみをカウント）
        const actualSections = Object.keys(allSections).filter((key) => !isNaN(Number(key)))
        const totalSections = actualSections.length

        // デバッグ用に完了したセクション数をログ出力
        console.log(`${assessment.name}の完了セクション:`, {
          sectionProgress,
          completedSections,
          totalSections,
        })

        return {
          id: assessment.id,
          name: assessment.name,
          location: assessment.location,
          status: status,
          progress: overallProgress,
          lastUpdated: formatLastUpdated(new Date(assessment.updatedAt)),
          riskLevel: assessment.riskScore?.riskLevel || getRiskLevel(assessment, sectionProgress, overallProgress),
          completedSections: completedSections,
          totalSections: totalSections, // 修正: 実際のセクション数を使用
        }
      })
      setFormattedAssessments(formatted)
    } else {
      setFormattedAssessments([])
    }
  }, [assessmentList])

  // 各セクションの進捗状況を計算する関数
  const calculateSectionProgress = (assessment: any) => {
    const sectionProgress: Record<string, number> = {}

    // assessment.answers が undefined または null の場合は空のオブジェクトを使用
    const answers = assessment.answers || {}

    // allSections が undefined または null の場合のチェックを追加
    if (!allSections) {
      console.error("allSections is undefined or null")
      return sectionProgress
    }

    // 実際のセクションのみを処理（セクションIDが数値のプロパティのみ）
    const actualSections = Object.keys(allSections).filter((key) => !isNaN(Number(key)))

    actualSections.forEach((sectionId) => {
      const section = allSections[sectionId as keyof typeof allSections]
      // section が undefined または null の場合のチェックを追加
      if (!section || !section.questions) {
        sectionProgress[sectionId] = 0
        return
      }

      const sectionAnswers = answers[sectionId] || {}

      // セクションの質問数
      const totalQuestions = Object.keys(section.questions).length
      if (totalQuestions === 0) {
        sectionProgress[sectionId] = 0
        return
      }

      // 回答済みの質問数
      const answeredQuestions = Object.keys(sectionAnswers).length

      // セクションの進捗率を計算
      const progress = Math.round((answeredQuestions / totalQuestions) * 100)

      // 進捗率が100%を超えないようにする
      sectionProgress[sectionId] = Math.min(progress, 100)
    })

    // デバッグ用にsectionProgressの内容をログ出力
    console.log("計算されたセクション進捗:", sectionProgress)

    return sectionProgress
  }

  // 全体の進捗状況を計算する関数
  const calculateOverallProgress = (sectionProgress: Record<string, number>) => {
    // 各セクションの重み
    const sectionWeights: Record<string, number> = {
      "1": 20, // 基本情報
      "2": 20, // 物理的セキュリティ
      "3": 20, // 電源設備
      "4": 20, // 空調設備
      "5": 20, // 運用管理
    }

    let totalProgress = 0
    let totalWeight = 0

    Object.entries(sectionProgress).forEach(([sectionId, progress]) => {
      const weight = sectionWeights[sectionId] || 0
      totalProgress += progress * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0
  }

  // 必須セクションが完了しているかチェックする関数
  const checkRequiredSectionsCompleted = (sectionProgress: Record<string, number>) => {
    // 必須セクションのID
    const requiredSectionIds = ["1", "2", "3"] // 基本情報、物理的セキュリティ、電源設備

    // すべての必須セクションが完了しているかチェック
    return requiredSectionIds.every((sectionId) => sectionProgress[sectionId] === 100)
  }

  // ステータスを決定する関数
  const determineStatus = (overallProgress: number, completedSections: number, requiredSectionsCompleted: boolean) => {
    if (overallProgress === 100) {
      return "完了"
    } else if (requiredSectionsCompleted) {
      return "必須完了"
    } else if (overallProgress > 0) {
      return "進行中"
    } else {
      return "未開始"
    }
  }

  // 最終更新日をフォーマットする関数
  const formatLastUpdated = (date: Date) => {
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

  // リスクレベルを計算する関数
  const getRiskLevel = (assessment: any, sectionProgress: Record<string, number>, overallProgress: number) => {
    // 進捗が0%の場合は「未回答」
    if (overallProgress === 0) {
      return "未回答"
    }

    // リスクスコアが既に計算されている場合はそれを使用
    if (assessment.riskScore && assessment.riskScore.riskLevel) {
      return assessment.riskScore.riskLevel
    }

    // 災害リスクセクションの進捗状況に基づいてリスクレベルを決定
    const disasterRiskProgress = sectionProgress["4"] || 0 // 空調設備（災害リスク）

    // 災害リスクセクションが完了していない場合は、建物構造と設備構造の進捗状況も考慮
    if (disasterRiskProgress < 100) {
      const buildingStructureProgress = sectionProgress["2"] || 0 // 物理的セキュリティ（建物構造）
      const facilityEquipmentProgress = sectionProgress["3"] || 0 // 電源設備（設備構造）

      // 建物構造と設備構造の両方が完了していない場合は高リスク
      if (buildingStructureProgress < 100 && facilityEquipmentProgress < 100) {
        return "高"
      }

      // 建物構造または設備構造のいずれかが完了していない場合は中リスク
      if (buildingStructureProgress < 100 || facilityEquipmentProgress < 100) {
        return "中"
      }
    }

    // 全体の進捗状況に基づいてリスクレベルを決定
    if (overallProgress < 30) return "高"
    if (overallProgress < 70) return "中"
    return "低"
  }

  const getStatusBadge = (status: string, riskLevel: string) => {
    if (status === "完了") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          完了
        </Badge>
      )
    }

    if (status === "必須完了") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          必須完了
        </Badge>
      )
    }

    if (riskLevel === "未回答") {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          未回答
        </Badge>
      )
    }

    if (riskLevel === "高") {
      return <Badge variant="destructive">高リスク</Badge>
    }

    if (riskLevel === "中") {
      return <Badge variant="secondary">中リスク</Badge>
    }

    return <Badge variant="outline">進行中</Badge>
  }

  const getStatusIcon = (status: string, riskLevel: string) => {
    if (status === "完了") {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }

    if (status === "必須完了") {
      return <CheckCircle className="h-4 w-4 text-blue-500" />
    }

    if (riskLevel === "未回答") {
      return <HelpCircle className="h-4 w-4 text-gray-400" />
    }

    if (riskLevel === "高") {
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    }

    return <Clock className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="space-y-4">
      {formattedAssessments.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">評価データがありません</p>
        </div>
      ) : (
        formattedAssessments.map((assessment) => (
          <div key={assessment.id} className="flex items-center justify-between space-x-4 rounded-md border p-4">
            <div className="flex items-start gap-3 overflow-hidden">
              <div className="mt-1">{getStatusIcon(assessment.status, assessment.riskLevel)}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link href={`/assessment/${assessment.id}`}>
                    <span className="font-medium hover:underline text-foreground">{assessment.name}</span>
                  </Link>
                  {getStatusBadge(assessment.status, assessment.riskLevel)}
                </div>
                <div className="text-sm text-muted-foreground">{assessment.location}</div>
                <div className="w-full max-w-[200px]">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>進捗</span>
                    <span>{assessment.progress}%</span>
                  </div>
                  <Progress value={assessment.progress} className="h-1" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground whitespace-nowrap">更新: {assessment.lastUpdated}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">メニューを開く</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-foreground">アクション</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Link href={`/assessment/${assessment.id}`} className="w-full text-foreground">
                      詳細を表示
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-foreground">レポートを生成</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-foreground">複製</DropdownMenuItem>
                  <DropdownMenuItem className="text-foreground">アーカイブ</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

