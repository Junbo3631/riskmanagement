import { createClient } from "@/utils/supabase/client"
import { getAnswers } from "@/lib/assessment-service"
import type { AnswerData } from "@/types"

// Supabaseクライアントの初期化
const supabase = createClient()

// リスクスコア項目の型定義
interface ScoreItem {
  score: number
  weight: number
}

// 質問オプションからリスクスコア情報を取得する関数
export async function getOptionRiskInfo(
  questionId: string,
  optionValue: string | number | string[],
): Promise<{ risk_score: number; weight: number; risk_factor: string } | null> {
  try {
    console.log(`質問ID ${questionId} のオプション ${optionValue} のリスク情報を取得します`)

    // 値が配列の場合は最初の要素を使用
    const value = Array.isArray(optionValue) ? optionValue[0] : optionValue

    // 質問オプションテーブルからリスクスコア、重み、リスク要因を取得
    const { data, error } = await supabase
      .from("question_options")
      .select("risk_score, weight, risk_factor")
      .eq("question_id", questionId)
      .eq("option_value", String(value))
      .maybeSingle()

    if (error) {
      console.error(`オプションリスク情報取得エラー:`, error)
      return null
    }

    if (!data) {
      console.warn(`質問ID ${questionId} のオプション ${value} が見つかりません`)
      // 代替カラム名で試す
      const { data: altData, error: altError } = await supabase
        .from("question_options")
        .select("risk_score, weight, risk_factor")
        .eq("question_id", questionId)
        .eq("value", String(value))
        .maybeSingle()

      if (altError || !altData) {
        console.warn(`代替カラム名でも情報が見つかりませんでした`)
        return null
      }

      // weightが設定されていない場合はデフォルト値として1を使用
      const weight = altData.weight || 1

      return {
        risk_score: altData.risk_score || 0,
        weight: weight,
        risk_factor: altData.risk_factor || "unknown",
      }
    }

    // weightが設定されていない場合はデフォルト値として1を使用
    const weight = data.weight || 1

    console.log(`質問ID ${questionId} のオプション ${value} のリスク情報:`, {
      risk_score: data.risk_score,
      weight: weight,
      risk_factor: data.risk_factor,
    })

    return {
      risk_score: data.risk_score || 0,
      weight: weight,
      risk_factor: data.risk_factor || "unknown",
    }
  } catch (err) {
    console.error(`オプションリスク情報取得中の例外:`, err)
    return null
  }
}

// 後方互換性のために元の関数も維持
export async function getOptionRiskScore(
  questionId: string,
  optionValue: string | number | string[],
): Promise<number | null> {
  const riskInfo = await getOptionRiskInfo(questionId, optionValue)
  return riskInfo ? riskInfo.risk_score : null
}

// 重み付け平均を計算する関数
function calculateWeightedAverage(scores: ScoreItem[]): number | null {
  if (scores.length === 0) return null

  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) return 0

  const weightedSum = scores.reduce((sum, item) => sum + item.score * item.weight, 0)

  return Math.round(weightedSum / totalWeight)
}

// シンプルな平均を計算する関数（バックアップ用）
function calculateAverage(scores: number[]): number {
  if (scores.length === 0) return 0
  const sum = scores.reduce((a, b) => a + b, 0)
  return Math.round(sum / scores.length)
}

// 施設のリスクスコアを計算する関数
export async function calculateFacilityRiskScore(facilityId: string) {
  try {
    console.log(`施設ID ${facilityId} のリスクスコアを計算します`)

    // 回答データを取得
    const answers = await getAnswers(facilityId)
    console.log(`取得した回答数: ${answers.length}`)

    if (answers.length === 0) {
      console.warn(`施設ID ${facilityId} の回答がありません`)
      return null
    }

    // リスク要因ごとのスコアとウェイトを格納
    const probabilityScores: ScoreItem[] = []
    const impactScores: ScoreItem[] = []
    const mitigationScores: ScoreItem[] = []

    // リスク要因が不明なスコア（バックアップ用）
    const sectionScores: { [key: string]: number[] } = {
      "1": [], // 発生確率
      "2": [], // 影響度
      "3": [], // 対策
    }

    // 各回答のリスクスコアを計算
    await Promise.all(
      answers.map(async (answer: AnswerData) => {
        const questionId = answer.question_id

        // 質問IDからセクションIDを抽出（バックアップ用）
        const sectionId = Math.floor(Number(questionId) / 1000)

        // 回答値を取得
        let answerValue: string | number | string[] = ""

        if (answer.selected_options && answer.selected_options.length > 0) {
          answerValue = answer.selected_options
        } else if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
          answerValue = answer.numeric_value
        } else if (answer.value) {
          answerValue = answer.value
        }

        // 回答値が空の場合はスキップ
        if (!answerValue) return

        // リスクスコア情報を取得
        const riskInfo = await getOptionRiskInfo(questionId, answerValue)

        if (!riskInfo) {
          console.warn(`質問 ${questionId} の回答 ${answerValue} のリスク情報が取得できませんでした`)
          return
        }

        // リスク要因に基づいてスコアを分類
        const scoreItem: ScoreItem = {
          score: riskInfo.risk_score,
          weight: riskInfo.weight,
        }

        if (riskInfo.risk_factor === "probability") {
          probabilityScores.push(scoreItem)
          // バックアップ用にも保存
          sectionScores["1"].push(riskInfo.risk_score)
        } else if (riskInfo.risk_factor === "impact") {
          impactScores.push(scoreItem)
          // バックアップ用にも保存
          sectionScores["2"].push(riskInfo.risk_score)
        } else if (riskInfo.risk_factor === "mitigation") {
          mitigationScores.push(scoreItem)
          // バックアップ用にも保存
          sectionScores["3"].push(riskInfo.risk_score)
        } else {
          // リスク要因が未設定の場合はセクションIDに基づいて分類（バックアップ）
          if (sectionId >= 1 && sectionId <= 3) {
            sectionScores[String(sectionId)].push(riskInfo.risk_score)
          }
        }
      }),
    )

    console.log(`発生確率スコア項目数: ${probabilityScores.length}`)
    console.log(`影響度スコア項目数: ${impactScores.length}`)
    console.log(`対策レベルスコア項目数: ${mitigationScores.length}`)

    // リスク要因に基づく重み付け平均を計算
    let probabilityScore = calculateWeightedAverage(probabilityScores)
    let impactScore = calculateWeightedAverage(impactScores)
    let mitigationScore = calculateWeightedAverage(mitigationScores)

    // リスク要因に基づくスコアが計算できなかった場合、セクションIDに基づくバックアップを使用
    if (probabilityScore === null) {
      probabilityScore = calculateAverage(sectionScores["1"])
      console.log("バックアップの発生確率スコアを使用:", probabilityScore)
    }

    if (impactScore === null) {
      impactScore = calculateAverage(sectionScores["2"])
      console.log("バックアップの影響度スコアを使用:", impactScore)
    }

    if (mitigationScore === null) {
      mitigationScore = calculateAverage(sectionScores["3"])
      console.log("バックアップの対策スコアを使用:", mitigationScore)
    }

    // スコアが空の場合はnullを返す
    if (probabilityScore === null && impactScore === null && mitigationScore === null) {
      console.warn(`有効なリスクスコアがありません`)
      return null
    }

    // nullの場合はデフォルト値を使用
    probabilityScore = probabilityScore ?? 0
    impactScore = impactScore ?? 0
    mitigationScore = mitigationScore ?? 0

    // 総合スコアを計算 - 対策スコアが高いほどリスクが低くなるため調整が必要
    // 対策スコアを逆にして計算（5-score、ただしスコアが0未満にならないように）
    const adjustedMitigationScore = Math.max(0, 5 - mitigationScore)
    const totalScore = Math.round((probabilityScore + impactScore + adjustedMitigationScore) / 3)

    // リスクレベルを判定
    let riskLevel = "低"
    if (totalScore >= 4) {
      riskLevel = "高"
    } else if (totalScore >= 2) {
      riskLevel = "中"
    }

    console.log(
      `計算結果: 発生確率=${probabilityScore}, 影響度=${impactScore}, 対策レベル=${mitigationScore}, 調整後対策=${adjustedMitigationScore}, 総合=${totalScore}, レベル=${riskLevel}`,
    )

    return {
      probability_score: probabilityScore,
      impact_score: impactScore,
      mitigation_score: mitigationScore,
      total_score: totalScore,
      risk_level: riskLevel,
    }
  } catch (err) {
    console.error(`リスクスコア計算中の例外:`, err)
    return null
  }
}

// リスクスコアを計算して保存する関数
export async function calculateAndSaveRiskScore(facilityId: string) {
  try {
    console.log(`施設ID ${facilityId} のリスクスコアを計算して保存します`)

    // リスクスコアを計算
    const riskScoreData = await calculateFacilityRiskScore(facilityId)

    // リスクスコアがnullの場合は保存しない
    if (!riskScoreData) {
      console.warn(`リスクスコアが計算できないため保存しません`)
      return null
    }

    // リスクスコアをデータベースに保存
    const { data, error } = await supabase
      .from("risk_scores")
      .upsert(
        {
          facility_id: facilityId,
          ...riskScoreData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "facility_id" },
      )
      .select()
      .single()

    if (error) {
      console.error(`リスクスコア保存エラー:`, error)
      return riskScoreData
    }

    console.log(`リスクスコアを保存しました:`, data)
    return data
  } catch (err) {
    console.error(`リスクスコア計算・保存中の例外:`, err)
    return null
  }
}

// デバッグ用：特定の質問の選択肢とリスクスコアを取得する関数
export async function getQuestionOptionsWithRiskScores(questionId: string) {
  try {
    const { data, error } = await supabase.from("question_options").select("*").eq("question_id", questionId)

    if (error) {
      console.error(`質問 ${questionId} のオプション取得エラー:`, error)
      return null
    }

    return data
  } catch (err) {
    console.error("オプション取得中にエラーが発生しました:", err)
    return null
  }
}

