"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase-client"

interface AssessmentProgressProps {
  facilityId: string
  sectionId?: string
  userId?: string
}

export default function AssessmentProgress({ facilityId, sectionId, userId }: AssessmentProgressProps) {
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [debug, setDebug] = useState<{
    totalQuestions: number
    answeredQuestions: number
    questionIds: string[]
    answerIds: string[]
  }>({ totalQuestions: 0, answeredQuestions: 0, questionIds: [], answerIds: [] })

  useEffect(() => {
    async function calculateProgress() {
      try {
        setLoading(true)

        // 質問を取得
        let questionsQuery = supabase.from("questions").select("id")
        if (sectionId) {
          questionsQuery = questionsQuery.eq("section_id", sectionId)
        }
        const { data: questions, error: questionsError } = await questionsQuery

        if (questionsError) {
          console.error("質問の取得エラー:", questionsError)
          return
        }

        if (!questions || questions.length === 0) {
          setProgress(0)
          setDebug({
            totalQuestions: 0,
            answeredQuestions: 0,
            questionIds: [],
            answerIds: [],
          })
          return
        }

        // 質問IDのリストを作成
        const questionIds = questions.map((q) => q.id)

        // 回答を取得
        let answersQuery = supabase.from("answers").select("*").eq("facility_id", facilityId)
        if (userId) {
          answersQuery = answersQuery.eq("user_id", userId)
        }
        const { data: answers, error: answersError } = await answersQuery

        if (answersError) {
          console.error("回答の取得エラー:", answersError)
          return
        }

        // 回答済みの質問をカウント
        const answeredQuestionIds = new Set()
        answers?.forEach((answer) => {
          if (answer.value && answer.value.trim() !== "" && questionIds.includes(answer.question_id)) {
            answeredQuestionIds.add(answer.question_id)
          }
        })

        // 進捗率を計算
        const answeredCount = answeredQuestionIds.size
        const totalCount = questionIds.length
        const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0

        setProgress(Math.round(progressPercentage))
        setDebug({
          totalQuestions: totalCount,
          answeredQuestions: answeredCount,
          questionIds: questionIds,
          answerIds: Array.from(answeredQuestionIds) as string[],
        })

        console.log("進捗状況デバッグ:", {
          facilityId,
          sectionId,
          userId,
          totalQuestions: totalCount,
          answeredQuestions: answeredCount,
          progress: Math.round(progressPercentage),
        })
      } catch (err) {
        console.error("進捗状況の計算エラー:", err)
        setProgress(0)
      } finally {
        setLoading(false)
      }
    }

    if (facilityId) {
      calculateProgress()
    }
  }, [facilityId, sectionId, userId])

  if (loading) {
    return <Progress value={0} className="w-full" />
  }

  return (
    <div className="space-y-2">
      <Progress value={progress} className="w-full" />
      <div className="flex justify-between text-sm">
        <span>進捗状況: {progress}%</span>
        <span className="text-gray-500">
          ({debug.answeredQuestions}/{debug.totalQuestions})
        </span>
      </div>
    </div>
  )
}

