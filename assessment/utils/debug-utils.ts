import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * デバッグ情報をログに出力する関数
 */
export function logDebugInfo(message: string, data?: any): void {
  console.log(`[DEBUG] ${message}`, data || "")
}

/**
 * 質問IDからセクションIDを抽出する関数
 */
export function extractSectionIdFromQuestionId(questionId: string | number): number {
  try {
    // 数値型の場合はそのまま返す
    if (typeof questionId === "number") {
      return Math.floor(questionId / 1000)
    }

    // 文字列型の場合は数値に変換を試みる
    const numericId = Number(questionId)
    if (!isNaN(numericId)) {
      return Math.floor(numericId / 1000)
    }

    // 数値形式でない場合は、セクションIDを特定できないためエラーログを出力
    console.error(`数値形式でない質問ID "${questionId}" が見つかりました。セクションIDを特定できません。`)

    // デフォルト値として1を返す（最初のセクション）
    return 1
  } catch (error) {
    console.error(`質問ID "${questionId}" からセクションIDを抽出中にエラーが発生しました:`, error)
    return 1 // エラー時はデフォルト値として1を返す
  }
}

/**
 * セクションと質問のIDの対応関係を確認する関数
 */
export async function checkSectionAndQuestionIds() {
  try {
    // セクションテーブルの構造を確認
    const { data: sectionsColumns, error: sectionsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "sections")

    if (sectionsError) {
      console.error("セクションテーブル構造の取得エラー:", sectionsError)
      return { error: sectionsError.message }
    }

    // 質問テーブルの構造を確認
    const { data: questionsColumns, error: questionsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "questions")

    if (questionsError) {
      console.error("質問テーブル構造の取得エラー:", questionsError)
      return { error: questionsError.message }
    }

    // セクションデータを取得
    const { data: sections, error: sectionsDataError } = await supabase
      .from("sections")
      .select("id, name") // titleをnameに変更
      .order("id")

    if (sectionsDataError) {
      console.error("セクションデータの取得エラー:", sectionsDataError)
      return { error: sectionsDataError.message }
    }

    // 各セクションの質問を取得
    const sectionQuestions = []
    for (const section of sections) {
      const { data: questions, error: questionsDataError } = await supabase
        .from("questions")
        .select("id, text, section_id")
        .eq("section_id", section.id)
        .order("id")

      if (questionsDataError) {
        console.error(`セクション${section.id}の質問取得エラー:`, questionsDataError)
        continue
      }

      sectionQuestions.push({
        section_id: section.id,
        section_name: section.name, // section_titleをsection_nameに変更
        questions: questions,
      })
    }

    return {
      sections_columns: sectionsColumns,
      questions_columns: questionsColumns,
      section_questions: sectionQuestions,
    }
  } catch (error) {
    console.error("IDチェック中のエラー:", error)
    return { error: error.message }
  }
}

/**
 * 特定の評価IDに関連する回答データを確認する関数
 */
export async function checkAnswersForAssessment(assessmentId: string) {
  try {
    const { data, error } = await supabase.from("answers").select("*").eq("assessment_id", assessmentId)

    if (error) {
      console.error("回答データの取得エラー:", error)
      return { error: error.message }
    }

    return { answers: data }
  } catch (error) {
    console.error("回答チェック中のエラー:", error)
    return { error: error.message }
  }
}

/**
 * テーブルの構造を確認する関数
 */
export async function checkTableStructure(tableName: string) {
  try {
    // 直接SQLを実行してテーブル構造を取得
    const { data, error } = await supabase.rpc("get_table_info", { table_name: tableName })

    if (error) {
      console.error(`${tableName}テーブル構造の取得エラー:`, error)
      return { error: error.message }
    }

    return { structure: data }
  } catch (error) {
    console.error("テーブル構造チェック中のエラー:", error)
    return { error: error.message }
  }
}

