"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import QuestionSectionDebugger from "@/components/question-section-debugger"
import AnswersDebugger from "@/components/answers-debugger"
import SectionManager from "@/components/section-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase-client"
import { extractSectionIdFromQuestionId } from "@/utils/debug-utils"

export default function DebugPage() {
  const [fixingQuestions, setFixingQuestions] = useState(false)
  const [fixResult, setFixResult] = useState<string | null>(null)
  const [newSectionId, setNewSectionId] = useState<string>("")
  const [newSectionName, setNewSectionName] = useState<string>("")
  const [addingSectionResult, setAddingSectionResult] = useState<string | null>(null)

  const fixQuestionSectionIds = async () => {
    setFixingQuestions(true)
    setFixResult(null)

    try {
      // 質問を取得
      const { data: questions, error: questionsError } = await supabase.from("questions").select("*")

      if (questionsError) throw questionsError

      // セクションを取得
      const { data: sections, error: sectionsError } = await supabase.from("sections").select("*")

      if (sectionsError) throw sectionsError

      // セクションIDのマップを作成
      const sectionIds = new Set(sections?.map((section) => section.id.toString()) || [])

      // 修正が必要な質問を特定
      const questionsToFix = questions?.filter((question) => {
        const extractedSectionId = extractSectionIdFromQuestionId(question.id)
        return (
          extractedSectionId &&
          (question.section_id.toString() !== extractedSectionId || !sectionIds.has(question.section_id.toString()))
        )
      })

      if (!questionsToFix || questionsToFix.length === 0) {
        setFixResult("修正が必要な質問はありませんでした。")
        return
      }

      // 質問のセクションIDを修正
      let fixedCount = 0
      for (const question of questionsToFix) {
        const extractedSectionId = extractSectionIdFromQuestionId(question.id)

        if (extractedSectionId && sectionIds.has(extractedSectionId)) {
          const { error } = await supabase
            .from("questions")
            .update({ section_id: extractedSectionId })
            .eq("id", question.id)

          if (!error) {
            fixedCount++
          }
        }
      }

      setFixResult(`${questionsToFix.length}件の質問のうち、${fixedCount}件の質問のセクションIDを修正しました。`)
    } catch (err: any) {
      setFixResult(`エラーが発生しました: ${err.message}`)
      console.error("質問修正エラー:", err)
    } finally {
      setFixingQuestions(false)
    }
  }

  const addSection = async () => {
    if (!newSectionId || !newSectionName) {
      setAddingSectionResult("セクションIDと名前を入力してください。")
      return
    }

    try {
      // セクションを追加
      const { error } = await supabase.from("sections").insert({
        id: newSectionId,
        name: newSectionName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setAddingSectionResult(`セクション「${newSectionName}」(ID: ${newSectionId})を追加しました。`)
      setNewSectionId("")
      setNewSectionName("")
    } catch (err: any) {
      setAddingSectionResult(`エラーが発生しました: ${err.message}`)
      console.error("セクション追加エラー:", err)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">デバッグツール</h1>

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections">セクション管理</TabsTrigger>
          <TabsTrigger value="questions">質問とセクション</TabsTrigger>
          <TabsTrigger value="answers">回答データ</TabsTrigger>
          <TabsTrigger value="fix">データ修正</TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <SectionManager />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionSectionDebugger />
        </TabsContent>

        <TabsContent value="answers">
          <AnswersDebugger />
        </TabsContent>

        <TabsContent value="fix">
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>データ修正ツール</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">質問のセクションID修正</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    質問IDから抽出したセクションIDと、質問に設定されているセクションIDが一致しない場合に修正します。
                  </p>
                  <Button
                    onClick={fixQuestionSectionIds}
                    disabled={fixingQuestions}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {fixingQuestions ? "修正中..." : "質問のセクションIDを修正"}
                  </Button>

                  {fixResult && (
                    <p className={`mt-2 ${fixResult.includes("エラー") ? "text-red-500" : "text-green-500"}`}>
                      {fixResult}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

