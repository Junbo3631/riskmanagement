"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { checkDatabaseStructure } from "@/lib/db-diagnostics"

export default function DatabaseDebug() {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await checkDatabaseStructure()
      setDiagnosticResult(result)
    } catch (err) {
      console.error("診断実行エラー:", err)
      setError(err.message || "診断の実行中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>データベース診断</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runDiagnostics} disabled={loading} className="mb-4">
          {loading ? "診断実行中..." : "データベース診断を実行"}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-lg mb-4">
            <h3 className="font-medium">エラーが発生しました</h3>
            <p>{error}</p>
          </div>
        )}

        {diagnosticResult && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-medium mb-2">テーブル情報</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">テーブル名</th>
                    <th className="border p-2 text-left">存在</th>
                    <th className="border p-2 text-left">レコード数</th>
                    <th className="border p-2 text-left">エラー</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosticResult.tables.map((table, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border p-2">{table.table}</td>
                      <td className="border p-2">{table.exists ? "✅" : "❌"}</td>
                      <td className="border p-2">{table.count}</td>
                      <td className="border p-2">{table.error || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {diagnosticResult.sections && diagnosticResult.sections.length > 0 && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">セクション一覧</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2 text-left">ID</th>
                      <th className="border p-2 text-left">名前</th>
                      <th className="border p-2 text-left">説明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnosticResult.sections.map((section, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border p-2">{section.id}</td>
                        <td className="border p-2">{section.name || "-"}</td>
                        <td className="border p-2">{section.description || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {diagnosticResult.questionSections && diagnosticResult.questionSections.length > 0 && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">質問テーブルのセクションID</h3>
                <div className="flex flex-wrap gap-2">
                  {diagnosticResult.questionSections.map((sectionId, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {sectionId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

