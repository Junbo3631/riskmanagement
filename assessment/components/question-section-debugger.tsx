"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase-client"
import { logDebugInfo, extractSectionIdFromQuestionId } from "@/utils/debug-utils"

export default function QuestionSectionDebugger() {
  const [questions, setQuestions] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [inconsistentQuestions, setInconsistentQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // セクションを取得
      const { data: sectionsData, error: sectionsError } = await supabase.from("sections").select("*")

      if (sectionsError) throw sectionsError

      // 質問を取得
      const { data: questionsData, error: questionsError } = await supabase.from("questions").select("*")

      if (questionsError) throw questionsError

      setSections(sectionsData || [])
      setQuestions(questionsData || [])

      // セクションIDの型を表示
      const sectionTypes = sectionsData?.map((section) => ({
        id: section.id,
        type: typeof section.id,
      }))

      logDebugInfo("セクションIDの型", sectionTypes)

      // 不整合のある質問を特定
      const inconsistent = questionsData?.filter((question) => {
        // 質問IDからセクションIDを抽出
        const extractedSectionId = extractSectionIdFromQuestionId(question.id)

        // セクションIDの型を考慮して比較
        const sectionIdMatches =
          extractedSectionId &&
          (question.section_id === extractedSectionId || question.section_id === Number.parseInt(extractedSectionId))

        if (!sectionIdMatches) {
          logDebugInfo(`セクションID不一致: 質問ID ${question.id}`, {
            設定されたセクションID: question.section_id,
            設定されたセクションIDの型: typeof question.section_id,
            抽出されたセクションID: extractedSectionId,
            抽出されたセクションIDの型: typeof extractedSectionId,
          })
        }

        // 質問のsection_idに対応するセクションが存在するか確認
        const sectionExists = sectionsData?.some((section) => {
          // 型を考慮して比較
          return (
            section.id === question.section_id ||
            (typeof section.id === "string" && section.id === question.section_id.toString()) ||
            (typeof section.id === "number" && section.id === Number.parseInt(question.section_id))
          )
        })

        if (!sectionExists) {
          logDebugInfo(`セクションが存在しない: 質問ID ${question.id}`, {
            セクションID: question.section_id,
            利用可能なセクションID: sectionsData?.map((s) => s.id),
          })
        }

        return !sectionIdMatches || !sectionExists
      })

      setInconsistentQuestions(inconsistent || [])

      logDebugInfo("セクション", sectionsData)
      logDebugInfo("質問", questionsData)
      logDebugInfo("不整合のある質問", inconsistent)
    } catch (err: any) {
      setError(err.message || "データの取得中にエラーが発生しました")
      console.error("デバッグデータ取得エラー:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>質問とセクションの整合性チェック</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchData} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? "チェック中..." : "チェック実行"}
        </Button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {!loading && sections.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium">セクション一覧 ({sections.length}件)</h3>
            <ul className="list-disc pl-5 mt-2">
              {sections.map((section) => (
                <li key={section.id}>
                  ID: {section.id} (型: {typeof section.id}), 名前: {section.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && inconsistentQuestions.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-red-500">不整合のある質問 ({inconsistentQuestions.length}件)</h3>
            <ul className="list-disc pl-5 mt-2">
              {inconsistentQuestions.map((question) => {
                const extractedSectionId = extractSectionIdFromQuestionId(question.id)
                return (
                  <li key={question.id} className="text-red-500">
                    質問ID: {question.id}, 設定されたセクションID: {question.section_id} (型:{" "}
                    {typeof question.section_id}), 抽出されたセクションID: {extractedSectionId || "なし"} (型:{" "}
                    {typeof extractedSectionId})
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {!loading && inconsistentQuestions.length === 0 && questions.length > 0 && (
          <p className="mt-4 text-green-500">すべての質問とセクションの関係は整合性があります。</p>
        )}
      </CardContent>
    </Card>
  )
}

