"use client"

import { Button } from "@/components/ui/button"
import { logAssessmentAnswers, logQuestionCounts, logSectionQuestions } from "@/lib/assessment-service"
import { useState } from "react"

interface DebugButtonProps {
  assessmentId: string
}

export function DebugButton({ assessmentId }: DebugButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDebug = async () => {
    try {
      setLoading(true)
      console.log("デバッグ情報を取得しています...")

      // 各セクションの質問数を取得
      await logQuestionCounts()

      // 各セクションの質問内容を取得
      for (let i = 1; i <= 5; i++) {
        await logSectionQuestions(i)
      }

      // 評価の回答データを取得
      await logAssessmentAnswers(assessmentId)

      console.log("デバッグ情報の取得が完了しました")
    } catch (error) {
      console.error("デバッグ情報の取得中にエラーが発生しました:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDebug}
      disabled={loading}
      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
    >
      {loading ? "デバッグ情報取得中..." : "デバッグ情報を取得"}
    </Button>
  )
}

