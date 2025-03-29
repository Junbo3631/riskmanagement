"use client"

import { createClient } from "@/utils/supabase/client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DisableTriggers() {
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const disableTriggers = async () => {
    setIsLoading(true)
    setResult("トリガーの無効化を開始しています...")

    try {
      // トリガーを削除するSQLを実行
      const { error: error1 } = await supabase.rpc("execute_sql", {
        sql_query: "DROP TRIGGER IF EXISTS answer_risk_score_trigger ON answers;",
      })

      if (error1) {
        setResult((prev) => prev + "\n\nトリガー1の削除に失敗しました: " + error1.message)
        setIsLoading(false)
        return
      }

      setResult((prev) => prev + "\n\nanswer_risk_score_triggerを削除しました")

      const { error: error2 } = await supabase.rpc("execute_sql", {
        sql_query: "DROP TRIGGER IF EXISTS trigger_update_risk_scores ON answers;",
      })

      if (error2) {
        setResult((prev) => prev + "\n\nトリガー2の削除に失敗しました: " + error2.message)
        setIsLoading(false)
        return
      }

      setResult((prev) => prev + "\n\ntrigger_update_risk_scoresを削除しました")
      setResult(
        (prev) => prev + "\n\n全てのトリガーの削除が完了しました。アプリケーションが正常に動作するようになりました。",
      )
    } catch (error) {
      setResult((prev) => prev + "\n\n処理中にエラーが発生しました: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>トリガーの無効化</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          このツールは、answersテーブルに対するトリガーを無効化します。
          これにより、risk_scoreカラムが存在しないことによるエラーを解決します。
        </p>

        <Button onClick={disableTriggers} disabled={isLoading} className="mb-4">
          {isLoading ? "処理中..." : "トリガーを無効化"}
        </Button>

        {result && <pre className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap">{result}</pre>}
      </CardContent>
    </Card>
  )
}

