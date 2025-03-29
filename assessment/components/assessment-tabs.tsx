"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectionList } from "@/components/section-list"
import { useState, useEffect } from "react"
import type { Section } from "@/types"

interface AssessmentTabsProps {
  assessmentId: string
}

interface SectionProgress {
  sectionId: number
  title: string
  progress: number
}

export function AssessmentTabs({ assessmentId }: AssessmentTabsProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [sectionProgress, setSectionProgress] = useState<SectionProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // APIルートを使用してセクションデータを取得
        const sectionsResponse = await fetch("/api/sections")
        if (!sectionsResponse.ok) {
          throw new Error("セクションデータの取得に失敗しました")
        }
        const sectionsData = await sectionsResponse.json()
        setSections(sectionsData)

        // APIルートを使用して回答データを取得
        const answersResponse = await fetch(`/api/answers?assessmentId=${assessmentId}`)
        if (!answersResponse.ok) {
          throw new Error("回答データの取得に失敗しました")
        }
        const answers = await answersResponse.json()

        // セクションごとの進捗率を計算
        const sectionProgressData = sectionsData.map((section: Section) => {
          // 各セクションに属する回答を抽出
          const sectionAnswers = answers.filter((answer: any) => {
            const questionId = Number(answer.question_id)
            const answerSectionId = Math.floor(questionId / 1000)
            return answerSectionId === section.id
          })

          // 各セクションの質問数（仮の値として10を使用）
          const questionsPerSection = 10

          // 進捗率を計算
          const progress =
            questionsPerSection > 0 ? Math.min(100, Math.round((sectionAnswers.length / questionsPerSection) * 100)) : 0

          return {
            sectionId: section.id,
            title: section.name,
            progress: progress,
          }
        })

        setSectionProgress(sectionProgressData)
      } catch (error) {
        console.error("タブデータの読み込みに失敗しました", error)
      } finally {
        setLoading(false)
      }
    }

    if (assessmentId) {
      loadData()
    }
  }, [assessmentId])

  return (
    <Tabs defaultValue="sections" className="w-full">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="sections">セクション一覧</TabsTrigger>
      </TabsList>
      <TabsContent value="sections" className="space-y-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <SectionList assessmentId={assessmentId} sections={sections} sectionProgress={sectionProgress} />
        )}
      </TabsContent>
    </Tabs>
  )
}

