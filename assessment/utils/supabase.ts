import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Supabaseクライアントの作成関数
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase環境変数が設定されていません")
    console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "設定済み" : "未設定")
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "設定済み" : "未設定")
    throw new Error("Supabase環境変数が設定されていません")
  }

  console.log("Supabaseクライアントを作成します")
  console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl.substring(0, 10) + "...")
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "設定済み" : "未設定")

  try {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey)
    console.log("Supabaseクライアントの作成に成功しました")
    return client
  } catch (error) {
    console.error("Supabaseクライアントの作成に失敗しました:", error)
    throw error
  }
}

// 互換性のために両方の名前でエクスポート
export const getSupabaseClient = createClient

