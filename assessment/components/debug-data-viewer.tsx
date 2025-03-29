"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAnswers, getQuestions, getSections } from "@/services/risk-assessment-service"
import { supabase } from "@/lib/supabase-client"

interface DebugDataViewerProps {
  facilityId: string
  userId?: string
}

export default function DebugDataViewer({ facilityId, userId }: DebugDataViewerProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataType, setDataType] = useState<string>("")

  const fetchData = async (type: string) => {
    setLoading(true)
    setError(null)
    setDataType(type)

    try {
      let result

      switch (type) {
        case "sections":
          result = await getSections()
          break
        case "questions":
          result = await getQuestions()
          break
        case "answers":
          result = await getAnswers(facilityId, userId)
          break
        case "raw-answers":
          const { data, error } = await supabase.from("answers").select("*").eq("facility_id", facilityId)

          if (error) throw error
          result = data
          break
        default:
          throw new Error("不明なデータタイプ")
      }

      setData(result)
    } catch (err: any) {
      console.error(`${type}データの取得エラー:`, err)
      setError(err.message || "データの取得中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>デバッグ情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Button onClick={() => fetchData("sections")} variant="outline" size="sm">
            セクション
          </Button>
          <Button onClick={() => fetchData("questions")} variant="outline" size="sm">
            質問
          </Button>
          <Button onClick={() => fetchData("answers")} variant="outline" size="sm">
            回答（フィルタ済）
          </Button>
          <Button onClick={() => fetchData("raw-answers")} variant="outline" size="sm">
            回答（生データ）
          </Button>
        </div>

        {loading && <p>読み込み中...</p>}

        {error && <p className="text-red-500">{error}</p>}

        {data && (
          <div>
            <h3 className="font-medium mb-2">
              {dataType} データ ({data.length}件)
            </h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

