"use server"

import { supabase } from "@/lib/supabase"
import type { RiskScore, IncidentCase } from "@/lib/types"

// リスクスコアを計算して取得する関数
export async function getRiskScores(): Promise<RiskScore[]> {
  try {
    // 施設データを取得
    const { data: facilities, error: facilitiesError } = await supabase.from("facilities").select("id, name")

    if (facilitiesError) throw facilitiesError

    // 回答データを取得 - question_id を含める
    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("id, facility_id, question_id, selected_option_ids")

    if (answersError) throw answersError

    // 質問オプションデータを取得 - question_id を含める
    const { data: questionOptions, error: optionsError } = await supabase
      .from("question_options")
      .select("option_id, question_id, category, risk_factor, risk_score, weight")

    if (optionsError) throw optionsError

    // デバッグ情報を出力
    console.log("Sample answer:", answers.length > 0 ? JSON.stringify(answers[0]) : "No answers")
    console.log("Sample option:", questionOptions.length > 0 ? JSON.stringify(questionOptions[0]) : "No options")

    // すべてのカテゴリを取得
    const allCategories = [...new Set(questionOptions.map((option) => option.category))]

    // リスクスコアを計算
    const riskScores: RiskScore[] = []

    for (const facility of facilities) {
      // この施設の回答を取得
      const facilityAnswers = answers.filter((a) => a.facility_id === facility.id)

      // カテゴリごとのスコアを集計するためのマップ
      const categoryScores: { [key: string]: { total: number; count: number } } = {}

      // 各回答について処理
      for (const answer of facilityAnswers) {
        // この回答に関連する質問オプションを取得
        const relatedOptions = questionOptions.filter((o) => o.question_id === answer.question_id)

        // selected_option_idsの処理を改善 - 単一要素配列[5]形式に特化
        let selectedOptionIds: number[] = []

        // JSONBデータの処理を改善 - 単一要素配列[5]形式に特化
        try {
          const rawData = answer.selected_option_ids
          console.log(`Raw selected_option_ids for answer ${answer.id}:`, JSON.stringify(rawData))

          // 単一要素配列[5]形式の処理
          if (Array.isArray(rawData) && rawData.length > 0) {
            // 配列の各要素を数値に変換
            selectedOptionIds = rawData
              .map((id) => {
                // 数値に変換
                const numId = typeof id === "number" ? id : Number(id)
                console.log(`Converting array element ${id} (${typeof id}) to number: ${numId}`)
                return numId
              })
              .filter((id) => !isNaN(id))
          }
          // その他の形式も処理（念のため）
          else if (rawData === null || rawData === undefined) {
            selectedOptionIds = []
          } else if (typeof rawData === "string") {
            try {
              const parsed = JSON.parse(rawData)
              if (Array.isArray(parsed)) {
                selectedOptionIds = parsed.map((id) => Number(id)).filter((id) => !isNaN(id))
              } else if (typeof parsed === "number") {
                selectedOptionIds = [parsed]
              }
            } catch (e) {
              const num = Number(rawData)
              if (!isNaN(num)) {
                selectedOptionIds = [num]
              }
            }
          } else if (typeof rawData === "number") {
            selectedOptionIds = [rawData]
          } else if (rawData && typeof rawData === "object") {
            selectedOptionIds = Object.values(rawData)
              .map((id) => Number(id))
              .filter((id) => !isNaN(id))
          }
        } catch (error) {
          console.error(
            `Error processing selected_option_ids for answer ${answer.id}:`,
            error,
            "Value:",
            answer.selected_option_ids,
          )
        }

        console.log(`Answer ID: ${answer.id}, Selected Option IDs: ${JSON.stringify(selectedOptionIds)}`)

        // 選択された各オプションについて処理
        for (const optionId of selectedOptionIds) {
          // 選択されたオプションを見つける（整数型として比較）
          const option = relatedOptions.find((o) => {
            // option_idを数値に変換
            const optionIdInt = typeof o.option_id === "number" ? o.option_id : Number(o.option_id)
            // 厳密な数値比較
            return optionIdInt === optionId
          })

          if (option) {
            // カテゴリごとにスコアを集計
            if (!categoryScores[option.category]) {
              categoryScores[option.category] = { total: 0, count: 0 }
            }

            // リスクスコア × 重みを計算して合計に加算
            categoryScores[option.category].total += option.risk_score * option.weight
            categoryScores[option.category].count += 1
          } else {
            console.log(`No matching option found for option_id: ${optionId} (type: ${typeof optionId})`)
            console.log(
              `Available options: ${relatedOptions.map((o) => `${o.option_id} (${typeof o.option_id})`).join(", ")}`,
            )
          }
        }
      }

      // すべてのカテゴリに対してスコアを計算
      for (const category of allCategories) {
        // この施設とカテゴリの組み合わせにデータがある場合
        if (categoryScores[category]) {
          const scores = categoryScores[category]
          const averageScore = scores.count > 0 ? scores.total / scores.count : 0

          // リスクレベルを決定
          let riskLevel: "low" | "medium" | "high"
          if (averageScore < 1.0) {
            riskLevel = "low"
          } else if (averageScore < 2.0) {
            riskLevel = "medium"
          } else {
            riskLevel = "high"
          }

          riskScores.push({
            facility_id: facility.id,
            facility_name: facility.name,
            risk_category: category,
            risk_score: averageScore,
            risk_level: riskLevel,
          })
        } else {
          // データがない場合は-1スコアで表示なしとして追加
          riskScores.push({
            facility_id: facility.id,
            facility_name: facility.name,
            risk_category: category,
            risk_score: -1,
            risk_level: "none",
          })
        }
      }
    }

    return riskScores
  } catch (error) {
    console.error("リスクスコアの取得に失敗しました:", error)
    throw error
  }
}

// リスクレベルに基づいて事故事例を取得する関数
export async function getIncidentCases(riskLevel: string): Promise<IncidentCase[]> {
  try {
    let query = supabase.from("incident_cases").select(`
        incident_id,
        incident_date,
        facility_name,
        risk_category,
        incident_summary,
        incident_detail,
        cause,
        impact,
        recovery_actions,
        incident_severity,
        insurance_claimed,
        insurance_amount
      `)

    // リスクレベルに基づいてフィルタリング
    if (riskLevel === "low") {
      query = query.lt("incident_severity", 1.0)
    } else if (riskLevel === "medium") {
      query = query.gte("incident_severity", 1.0).lt("incident_severity", 2.0)
    } else if (riskLevel === "high") {
      query = query.gte("incident_severity", 2.0)
    }

    const { data, error } = await query

    if (error) throw error

    return data
  } catch (error) {
    console.error("事故事例の取得に失敗しました:", error)
    throw error
  }
}

