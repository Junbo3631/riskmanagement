import { createClient } from "@supabase/supabase-js"

// データベース診断用の関数
export async function checkDatabaseStructure() {
  try {
    console.log("データベース構造の診断を開始します")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase環境変数が設定されていません")
      return {
        success: false,
        error: "Supabase環境変数が設定されていません",
        tables: [],
      }
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // テーブル一覧を取得
    const tables = ["sections", "questions", "answers", "assessments"]
    const results = []

    for (const table of tables) {
      try {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })

        if (error) {
          results.push({
            table,
            exists: false,
            count: 0,
            error: error.message,
          })
        } else {
          results.push({
            table,
            exists: true,
            count: count || 0,
            error: null,
          })
        }
      } catch (err) {
        results.push({
          table,
          exists: false,
          count: 0,
          error: err.message,
        })
      }
    }

    // sectionsテーブルの内容を取得
    let sections = []
    try {
      const { data, error } = await supabase.from("sections").select("*").order("id")

      if (!error && data) {
        sections = data
      }
    } catch (err) {
      console.error("sectionsテーブルの取得に失敗しました:", err)
    }

    // questionsテーブルのセクションIDを取得
    let questionSections = []
    try {
      const { data, error } = await supabase.from("questions").select("section_id").order("section_id")

      if (!error && data) {
        questionSections = [...new Set(data.map((q) => q.section_id))]
      }
    } catch (err) {
      console.error("questionsテーブルのセクションIDの取得に失敗しました:", err)
    }

    console.log("データベース構造の診断が完了しました")
    return {
      success: true,
      tables: results,
      sections,
      questionSections,
    }
  } catch (err) {
    console.error("データベース構造の診断中にエラーが発生しました:", err)
    return {
      success: false,
      error: err.message,
      tables: [],
    }
  }
}

