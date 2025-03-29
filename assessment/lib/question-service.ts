import { createClient } from "@/utils/supabase/client"
import type { QuestionOption } from "@/types"

// Supabaseクライアントの初期化
const supabase = createClient()

// 質問オプションを取得する関数
export async function getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
  try {
    console.log(`質問ID ${questionId} のオプションを取得中...`)

    const { data, error } = await supabase
      .from("question_options")
      .select("*")
      .eq("question_id", questionId)
      .order("value")

    if (error) {
      console.error(`質問オプション取得エラー:`, error)
      return []
    }

    if (!data || data.length === 0) {
      console.warn(`質問ID ${questionId} のオプションが見つかりません`)
      return []
    }

    console.log(`質問ID ${questionId} のオプションを ${data.length} 件取得しました`)
    return data as QuestionOption[]
  } catch (err) {
    console.error("質問オプション取得中の例外:", err)
    return []
  }
}

// 質問オプションからリスクスコアを取得する関数
export async function getRiskScoreForOption(questionId: string, optionValue: string | number): Promise<number> {
  try {
    // 質問オプションを取得
    const options = await getQuestionOptions(questionId)

    // 該当するオプションを検索
    const option = options.find(
      (opt) =>
        opt.value === optionValue ||
        (typeof optionValue === "number" && opt.value === String(optionValue)) ||
        (typeof optionValue === "string" && opt.value === optionValue),
    )

    // オプションが見つかった場合はそのリスクスコアを返す
    if (option && option.risk_score !== null && option.risk_score !== undefined) {
      return option.risk_score
    }

    // デフォルト値として中程度のリスクスコア3を返す
    console.warn(
      `質問ID ${questionId} のオプション ${optionValue} のリスクスコアが見つかりません。デフォルト値3を使用します。`,
    )
    return 3
  } catch (err) {
    console.error("リスクスコア取得中の例外:", err)
    // エラー時はデフォルト値として3を返す
    return 3
  }
}

