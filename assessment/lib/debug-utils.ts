import { createClient } from "@/utils/supabase/client"

// Supabaseクライアントの初期化
const supabase = createClient()

// 質問オプションのリスクスコアをデバッグ出力する関数
export async function debugQuestionOptions(questionId: string) {
  try {
    console.log(`質問ID ${questionId} のオプションを確認します`)

    const { data, error } = await supabase
      .from("question_options")
      .select("*")
      .eq("question_id", questionId)
      .order("value")

    if (error) {
      console.error(`質問オプション取得エラー:`, error)
      return
    }

    if (!data || data.length === 0) {
      console.warn(`質問ID ${questionId} のオプションが見つかりません`)
      return
    }

    console.log(`質問ID ${questionId} のオプション:`, data)

    // 各オプションのリスクスコアを確認
    data.forEach((option) => {
      console.log(`オプション値: ${option.value}, テキスト: ${option.text}, リスクスコア: ${option.risk_score}`)
    })
  } catch (err) {
    console.error(`デバッグ中の例外:`, err)
  }
}

// 施設の回答とそのリスクスコアをデバッグ出力する関数
export async function debugFacilityAnswers(facilityId: string) {
  try {
    console.log(`施設ID ${facilityId} の回答を確認します`)

    // 回答を取得
    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("*")
      .eq("facility_id", facilityId)

    if (answersError) {
      console.error(`回答取得エラー:`, answersError)
      return
    }

    if (!answers || answers.length === 0) {
      console.warn(`施設ID ${facilityId} の回答が見つかりません`)
      return
    }

    console.log(`施設ID ${facilityId} の回答数: ${answers.length}`)

    // 各回答のリスクスコアを確認
    for (const answer of answers) {
      console.log(`質問ID: ${answer.question_id}`)

      // 回答値を取得
      let answerValue = ""
      if (answer.selected_options && answer.selected_options.length > 0) {
        answerValue = answer.selected_options[0]
      } else if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
        answerValue = String(answer.numeric_value)
      } else if (answer.value) {
        answerValue = answer.value
      }

      console.log(`回答値: ${answerValue}`)

      // 質問オプションを取得
      const { data: options, error: optionsError } = await supabase
        .from("question_options")
        .select("*")
        .eq("question_id", answer.question_id)
        .eq("value", answerValue)

      if (optionsError) {
        console.error(`オプション取得エラー:`, optionsError)
        continue
      }

      if (!options || options.length === 0) {
        console.warn(`質問ID ${answer.question_id} のオプション ${answerValue} が見つかりません`)
        continue
      }

      console.log(`リスクスコア: ${options[0].risk_score}`)
    }
  } catch (err) {
    console.error(`デバッグ中の例外:`, err)
  }
}

