"use client"

import { useState, useEffect } from "react"
import type { Section, Question } from "@/types/risk-assessment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"

interface QuestionsFormProps {
  section: Section
  facilityId: string
  userId?: string
}

export default function QuestionsForm({ section, facilityId, userId }: QuestionsFormProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadQuestionsAndAnswers() {
      try {
        setLoading(true)
        setError(null)

        console.log("質問と回答を読み込み中:", { sectionId: section.id, facilityId, userId })

        // 質問を取得
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("section_id", section.id)
          .order("order")

        if (questionsError) {
          throw questionsError
        }

        setQuestions(questionsData)
        console.log("取得した質問:", questionsData.length, "件")

        // 回答を取得
        let answersQuery = supabase.from("answers").select("*").eq("facility_id", facilityId)

        if (userId) {
          answersQuery = answersQuery.eq("user_id", userId)
        }

        const { data: answersData, error: answersError } = await answersQuery

        if (answersError) {
          throw answersError
        }

        console.log("取得した回答:", answersData?.length || 0, "件")

        // 回答をquestion_idをキーとしたオブジェクトに変換
        const answersMap: Record<string, string> = {}
        answersData?.forEach((answer) => {
          answersMap[answer.question_id] = answer.value
        })

        setAnswers(answersMap)
      } catch (err: any) {
        setError("データの読み込み中にエラーが発生しました: " + err.message)
        console.error("データ読み込みエラー:", err)
      } finally {
        setLoading(false)
      }
    }

    if (section && facilityId) {
      loadQuestionsAndAnswers()
    }
  }, [section, facilityId, userId])

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // 各質問の回答を保存
      for (const question of questions) {
        const value = answers[question.id] || ""

        // 既存の回答を確認
        const { data: existingAnswers, error: checkError } = await supabase
          .from("answers")
          .select("id")
          .eq("facility_id", facilityId)
          .eq("question_id", question.id)

        if (checkError) {
          throw checkError
        }

        if (existingAnswers && existingAnswers.length > 0) {
          // 既存の回答を更新
          const { error: updateError } = await supabase
            .from("answers")
            .update({
              value,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingAnswers[0].id)

          if (updateError) {
            throw updateError
          }
        } else {
          // 新しい回答を作成
          const { error: insertError } = await supabase.from("answers").insert({
            facility_id: facilityId,
            question_id: question.id,
            value,
            section: section.id,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            throw insertError
          }
        }
      }

      toast({
        title: "保存完了",
        description: "回答が正常に保存されました",
      })
    } catch (err: any) {
      console.error("保存エラー:", err)
      toast({
        title: "エラー",
        description: "回答の保存中にエラーが発生しました: " + err.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <p>このセクションには質問がありません</p>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <h3 className="font-medium">{question.text}</h3>
                {question.description && <p className="text-sm text-gray-500">{question.description}</p>}
                <Textarea
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="回答を入力してください"
                  rows={3}
                />
              </div>
            ))}

            <Button onClick={handleSave} disabled={saving} className="mt-4">
              {saving ? "保存中..." : "回答を保存"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

