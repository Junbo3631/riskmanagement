"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getSections } from "@/services/risk-assessment-service"
import type { Section } from "@/types/risk-assessment"

interface SectionSelectorProps {
  assessmentId: string
  assessment: any
  onSectionSelect: (sectionId: string) => void
}

export function SectionSelector({ assessmentId, assessment, onSectionSelect }: SectionSelectorProps) {
  const { toast } = useToast()
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  // セクションデータを読み込む
  useEffect(() => {
    async function loadSections() {
      try {
        setLoading(true)
        const sectionsData = await getSections()
        console.log("取得したセクションデータ:", sectionsData)
        setSections(sectionsData)
      } catch (error) {
        console.error("セクションデータの読み込みに失敗しました:", error)
        toast({
          title: "エラー",
          description: "セクションデータの読み込みに失敗しました",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadSections()
  }, [toast])

  // セクションの進捗状況を計算
  const calculateSectionProgress = (sectionId: number | string) => {
    // セクションIDを文字列に変換（assessment.answersのキーは文字列）
    const sectionIdStr = String(sectionId)

    if (!assessment.answers || !assessment.answers[sectionIdStr]) {
      return 0
    }

    const sectionAnswers = assessment.answers[sectionIdStr]
    const totalQuestions = Object.keys(sectionAnswers).length
    if (totalQuestions === 0) {
      return 0
    }

    const answeredQuestions = Object.values(sectionAnswers).filter((value) => value !== null && value !== "").length
    return Math.round((answeredQuestions / totalQuestions) * 100)
  }

  // セクションの状態を取得
  const getSectionStatus = (sectionId: number | string) => {
    const progress = calculateSectionProgress(sectionId)
    if (progress === 0) {
      return { status: "未着手", variant: "outline" as const }
    } else if (progress < 100) {
      return { status: "進行中", variant: "secondary" as const }
    } else {
      return { status: "完了", variant: "default" as const }
    }
  }

  // ローディング中
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>セクション選択</CardTitle>
          <CardDescription>評価するセクションを選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">セクションデータを読み込んでいます...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>セクション選択</CardTitle>
        <CardDescription>評価するセクションを選択してください</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const { status, variant } = getSectionStatus(section.id)
            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                    <Badge variant={variant}>{status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <CardDescription className="mb-4">
                    {section.description || "このセクションの説明はありません"}
                  </CardDescription>
                  <Button onClick={() => onSectionSelect(String(section.id))} className="w-full">
                    {status === "完了" ? "編集する" : status === "進行中" ? "続きを入力" : "入力開始"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

