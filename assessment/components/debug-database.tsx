"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@supabase/supabase-js"

export default function DatabaseDebugger() {
  const [tableInfo, setTableInfo] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkDatabaseSchema = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase環境変数が設定されていません")
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // テーブル一覧を取得
      const tables = ["answers", "facilities", "questions", "sections", "risk_scores"]
      const schemaInfo: Record<string, string[]> = {}

      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select("*").limit(1)

          if (error) {
            schemaInfo[table] = [`エラー: ${error.message}`]
          } else if (data && data.length > 0) {
            schemaInfo[table] = Object.keys(data[0])
          } else {
            schemaInfo[table] = ["テーブルは存在しますが、データがありません"]
          }
        } catch (err) {
          schemaInfo[table] = [`例外: ${err instanceof Error ? err.message : String(err)}`]
        }
      }

      setTableInfo(schemaInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-2">データベーススキーマ確認</h3>

      <Button onClick={checkDatabaseSchema} disabled={loading} variant="outline" size="sm" className="mb-4">
        {loading ? "確認中..." : "スキーマを確認"}
      </Button>

      {error && <div className="p-2 bg-red-50 text-red-800 rounded-md mb-4">エラー: {error}</div>}

      {Object.keys(tableInfo).length > 0 && (
        <div className="space-y-4">
          {Object.entries(tableInfo).map(([table, columns]) => (
            <div key={table} className="p-2 bg-white rounded-md shadow-sm">
              <h4 className="font-medium">{table}</h4>
              <div className="text-sm mt-1">
                <strong>カラム:</strong> {columns.join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

