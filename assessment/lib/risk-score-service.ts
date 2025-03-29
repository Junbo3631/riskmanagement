import { getAnswers } from "@/lib/assessment-service"
import { getRiskScoreForOption } from "@/lib/question-service"
import type { AnswerData, RiskScoreData } from "@/types"

// リスクスコアを計算する関数
export async function calculateRiskScore(facilityId: string): Promise<{
  probabilityScore: number
  impactScore: number
  mitigationScore: number
  totalScore: number
  riskLevel: string
}> {
  try {
    // 回答データを取得
    const answers = await getAnswers(facilityId)

    if (!answers || answers.length === 0) {
      console.warn(`施設ID ${facilityId} の回答が見つかりません。デフォルトのリスクスコアを返します。`)
      return {
        probabilityScore: 0,
        impactScore: 0,
        mitigationScore: 0,
        totalScore: 0,
        riskLevel: "未評価",
      }
    }

    // 各カテゴリのスコアを計算
    const probabilityScores: number[] = []
    const impactScores: number[] = []
    const mitigationScores: number[] = []

    // 各回答のリスクスコアを取得
    await Promise.all(
      answers.map(async (answer: AnswerData) => {
        const questionId = answer.question_id

        // 回答の値を取得
        let answerValue: string | number | string[] = ""

        if (answer.selected_options && answer.selected_options.length > 0) {
          // 複数選択の場合は最初の選択肢を使用
          answerValue = answer.selected_options[0]
        } else if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
          answerValue = answer.numeric_value
        } else if (answer.value) {
          answerValue = answer.value
        }

        // 回答の値が空の場合はスキップ
        if (!answerValue) return

        // リスクスコアを取得
        const riskScore = await getRiskScoreForOption(questionId, answerValue)

        // 質問IDからカテゴリを判定（仮の実装）
        // 実際には質問テーブルからカテゴリを取得する必要があります
        const questionIdNum = Number(questionId)

        if (questionIdNum >= 1000 && questionIdNum < 2000) {
          // セクション1: 発生確率
          probabilityScores.push(riskScore)
        } else if (questionIdNum >= 2000 && questionIdNum < 3000) {
          // セクション2: 影響度
          impactScores.push(riskScore)
        } else if (questionIdNum >= 3000 && questionIdNum < 4000) {
          // セクション3: 対策レベル
          mitigationScores.push(riskScore)
        }
      }),
    )

    // 各カテゴリの平均スコアを計算
    const calculateAverage = (scores: number[]): number => {
      if (scores.length === 0) return 0
      const sum = scores.reduce((acc, score) => acc + score, 0)
      return Math.round((sum / scores.length) * 10) / 10 // 小数点第1位まで
    }

    const probabilityScore = calculateAverage(probabilityScores)
    const impactScore = calculateAverage(impactScores)
    const mitigationScore = calculateAverage(mitigationScores)

    // 総合スコアを計算
    const totalScore = Math.round(((probabilityScore + impactScore + mitigationScore) / 3) * 10) / 10

    // リスクレベルを判定
    let riskLevel = "低"
    if (totalScore >= 4) {
      riskLevel = "高"
    } else if (totalScore >= 2) {
      riskLevel = "中"
    }

    return {
      probabilityScore,
      impactScore,
      mitigationScore,
      totalScore,
      riskLevel,
    }
  } catch (error) {
    console.error("リスクスコア計算エラー:", error)
    // エラー時はデフォルト値を返す
    return {
      probabilityScore: 0,
      impactScore: 0,
      mitigationScore: 0,
      totalScore: 0,
      riskLevel: "エラー",
    }
  }
}

// リスクスコアを保存する関数
export async function saveRiskScoreToSupabase(
  facilityId: string,
  riskScore: {
    probabilityScore: number
    impactScore: number
    mitigationScore: number
    totalScore: number
    riskLevel: string
  },
): Promise<RiskScoreData | null> {
  // この関数は既存の assessment-service.ts の saveRiskScore 関数を使用するため、
  // ここでは実装しません。
  return null
}

