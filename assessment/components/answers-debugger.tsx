"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase-client"
import { logDebugInfo } from "@/utils/debug-utils"

export default function AnswersDebugger() {
  const [facilityId, setFacilityId] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnswers = async () => {
    if (!facilityId) {
      setError("施設IDを入力してください")
      return
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase.from("answers").select("*").eq("facility_id", facilityId)

      if (userId) {
        query = query.eq("user_id", userId)
      }

      const { data, error: answersError } = await query

      if (answersError) throw answersError

      setAnswers(data || [])
      logDebugInfo("回答データ", data)

      // 回答データの分析
      const sectionCounts: Record<string, number> = {}
      data?.forEach((answer) => {
        if (answer.section) {
          sectionCounts[answer.section] = (sectionCounts[answer.section] || 0) + 1
        }
      })

      logDebugInfo("セクション別回答数", sectionCounts)
    } catch (err: any) {
      setError(err.message || "回答データの取得中にエラーが発生しました")
      console.error("回答データ取得エラー:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>回答データデバッガー</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">施設ID</label>
            <Input value={facilityId} onChange={(e) => setFacilityId(e.target.value)} placeholder="施設IDを入力" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ユーザーID (オプション)</label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="ユーザーIDを入力" />
          </div>

          <Button onClick={fetchAnswers} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "取得中..." : "回答データを取得"}
          </Button>

          {error && <p className="text-red-500">{error}</p>}

          {!loading && answers.length > 0 && (
            <div>
              <h3 className="font-medium mt-4">回答データ ({answers.length}件)</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs mt-2">
                {JSON.stringify(answers, null, 2)}
              </pre>
            </div>
          )}

          {!loading && answers.length === 0 && !error && <p className="mt-4">回答データが見つかりませんでした。</p>}
        </div>
      </CardContent>
    </Card>
  )
}

