import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugEnvPage() {
  // 環境変数の存在を確認（値は表示しない）
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">環境変数デバッグ</h1>

      <Card>
        <CardHeader>
          <CardTitle>環境変数ステータス</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, exists]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full ${exists ? "bg-green-500" : "bg-red-500"}`}></span>
                <span className="font-mono">{key}</span>
                <span>{exists ? "設定済み" : "未設定"}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              注意:
              このページは環境変数が設定されているかどうかのみを表示します。実際の値はセキュリティのため表示されません。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

