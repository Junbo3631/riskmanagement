import { getAnswers } from "./supabase-service"
import { getQuestionOptions } from "./question-service"

// リスクスコア計算のための型定義
export interface RiskScoreResult {
  probabilityScore: number
  impactScore: number
  mitigationScore: number
  totalScore: number
  riskLevel: string
  probabilityDetails: RiskScoreDetail[]
  impactDetails: RiskScoreDetail[]
  mitigationDetails: RiskScoreDetail[]
}

export interface RiskScoreDetail {
  questionId: string
  answer: any
  score: number
  weight: number
  weightedScore: number
}

// リスクスコア計算関数
export async function calculateRiskScore(facilityId: string): Promise<RiskScoreResult> {
  try {
    console.log(`リスクスコア計算開始: facilityId=${facilityId}`)

    // 回答データを取得
    const answers = await getAnswers(facilityId)
    if (!answers || answers.length === 0) {
      throw new Error("回答データが見つかりません")
    }

    // 質問オプションを取得（リスクスコアを含む）
    const allQuestionOptions = await getQuestionOptions()

    // 回答データをマップ形式に変換
    const answersMap = new Map()
    answers.forEach((answer) => {
      answersMap.set(answer.question_id.toString(), {
        value: answer.value,
        numeric_value: answer.numeric_value,
        selected_options: answer.selected_options,
      })
    })

    // 発生確率に関する質問ID
    const probabilityQuestionIds = ["2001", "2004", "2007", "3001", "3004", "3007"]
    // 影響度に関する質問ID
    const impactQuestionIds = ["3002", "3005", "3008", "5001", "5003", "5005"]
    // 対策レベルに関する質問ID（その他すべての質問）
    const mitigationQuestionIds = [
      "1001",
      "1004",
      "1007",
      "1010",
      "2002",
      "2005",
      "2008",
      "3003",
      "3006",
      "3009",
      "4001",
      "4004",
      "4007",
      "5002",
      "5004",
      "5006",
      "5008",
      "5010",
      "5012",
    ]

    // 各カテゴリのリスクスコアを計算
    const probabilityResult = calculateCategoryScore(
      probabilityQuestionIds,
      answersMap,
      allQuestionOptions,
      getQuestionWeight("probability"),
    )

    const impactResult = calculateCategoryScore(
      impactQuestionIds,
      answersMap,
      allQuestionOptions,
      getQuestionWeight("impact"),
    )

    const mitigationResult = calculateCategoryScore(
      mitigationQuestionIds,
      answersMap,
      allQuestionOptions,
      getQuestionWeight("mitigation"),
    )

    // 総合リスクスコアを計算
    const totalScore = calculateTotalScore(probabilityResult.score, impactResult.score, mitigationResult.score)

    // リスクレベルを判定
    const riskLevel = determineRiskLevel(totalScore)

    console.log(`===== #発生確率スコア =====`)
    console.log(
      ` 合計: ${probabilityResult.score} (${probabilityResult.details.length}項目, 重み合計: ${probabilityResult.totalWeight})`,
    )
    console.log(` 詳細:`, probabilityResult.details)

    console.log(`===== #影響度スコア =====`)
    console.log(
      ` 合計: ${impactResult.score} (${impactResult.details.length}項目, 重み合計: ${impactResult.totalWeight})`,
    )
    console.log(` 詳細:`, impactResult.details)

    console.log(`===== #対策レベルスコア =====`)
    console.log(
      ` 合計: ${mitigationResult.score} (${mitigationResult.details.length}項目, 重み合計: ${mitigationResult.totalWeight})`,
    )
    console.log(` 詳細:`, mitigationResult.details)

    console.log(`===== #総合リスクスコア =====`)
    console.log(
      ` 計算式: (${probabilityResult.score} * ${impactResult.score}) / ${mitigationResult.score} = ${totalScore}`,
    )
    console.log(` リスクレベル: ${riskLevel}`)
    console.log(`===== リスクスコア計算終了 =====`)

    return {
      probabilityScore: probabilityResult.score,
      impactScore: impactResult.score,
      mitigationScore: mitigationResult.score,
      totalScore,
      riskLevel,
      probabilityDetails: probabilityResult.details,
      impactDetails: impactResult.details,
      mitigationDetails: mitigationResult.details,
    }
  } catch (error) {
    console.error("リスクスコア計算エラー:", error)
    throw error
  }
}

// カテゴリごとのスコア計算
function calculateCategoryScore(
  questionIds: string[],
  answersMap: Map<string, any>,
  questionOptions: any[],
  weightFunction: (questionId: string) => number,
) {
  let totalWeightedScore = 0
  let totalWeight = 0
  const details: RiskScoreDetail[] = []

  for (const questionId of questionIds) {
    const answer = answersMap.get(questionId)
    if (!answer) continue

    // 質問の重みを取得
    const weight = weightFunction(questionId)
    totalWeight += weight

    // 回答からリスクスコアを取得
    let score = 3 // デフォルト値は中間の3

    if (answer.selected_options && answer.selected_options.length > 0) {
      // 選択肢からリスクスコアを取得
      const optionId = answer.selected_options[0]
      const option = questionOptions.find((opt) => opt.id === optionId)
      if (option && option.risk_score !== undefined) {
        score = option.risk_score
      }
    } else if (answer.value) {
      // テキスト回答の場合、関連する選択肢を探す
      const options = questionOptions.filter((opt) => opt.question_id === Number.parseInt(questionId))
      // テキスト回答に基づいてスコアを推定（ここは実際のロジックに合わせて調整）
      // 例: 「良い」「優れている」などのキーワードがあれば低リスク
      const lowerValue = answer.value.toLowerCase()
      if (lowerValue.includes("優れ") || lowerValue.includes("良い") || lowerValue.includes("実施済")) {
        score = 1
      } else if (lowerValue.includes("普通") || lowerValue.includes("標準")) {
        score = 3
      } else if (lowerValue.includes("悪い") || lowerValue.includes("不足") || lowerValue.includes("未実施")) {
        score = 5
      }
    } else if (answer.numeric_value !== undefined && answer.numeric_value !== null) {
      // 数値回答の場合、値に基づいてスコアを設定
      // 例: 0-20%: 5, 21-40%: 4, 41-60%: 3, 61-80%: 2, 81-100%: 1
      const value = answer.numeric_value
      if (value >= 0 && value <= 20) score = 5
      else if (value > 20 && value <= 40) score = 4
      else if (value > 40 && value <= 60) score = 3
      else if (value > 60 && value <= 80) score = 2
      else if (value > 80 && value <= 100) score = 1
    }

    const weightedScore = score * weight
    totalWeightedScore += weightedScore

    details.push({
      questionId,
      answer: answer.selected_options || answer.value || answer.numeric_value,
      score,
      weight,
      weightedScore,
    })
  }

  // 重み付け平均を計算（回答がない場合はデフォルト値3を返す）
  const score = details.length > 0 ? Math.round((totalWeightedScore / totalWeight) * 10) / 10 : 3

  return {
    score,
    totalWeight,
    details,
  }
}

// 総合リスクスコアの計算
function calculateTotalScore(probabilityScore: number, impactScore: number, mitigationScore: number): number {
  // 対策レベルスコアが0の場合（データがない場合）はデフォルト値3を使用
  const safeMitigationScore = mitigationScore > 0 ? mitigationScore : 3

  // 発生確率 × 影響度 ÷ 対策レベル
  const rawScore = (probabilityScore * impactScore) / safeMitigationScore

  // 小数点第一位で四捨五入
  return Math.round(rawScore * 10) / 10
}

// リスクレベルの判定
function determineRiskLevel(totalScore: number): string {
  if (totalScore >= 4) return "高"
  if (totalScore >= 2) return "中"
  return "低"
}

// 質問の重みを取得する関数
function getQuestionWeight(category: "probability" | "impact" | "mitigation"): (questionId: string) => number {
  // 重みの定義（実際のビジネスロジックに合わせて調整）
  const weights: Record<string, number> = {
    // 発生確率の重み
    "2001": 1.5, // 建物の築年数
    "2004": 1.3, // 耐震性能
    "2007": 1.0, // 立地条件
    "3001": 1.8, // 電源設備の冗長性
    "3004": 1.6, // 消火設備
    "3007": 1.2, // 空調設備の冗長性

    // 影響度の重み
    "3002": 1.5, // バックアップ電源
    "3005": 1.7, // 水害対策
    "3008": 1.5, // セキュリティ対策
    "5001": 1.8, // 重要システムの割合
    "5003": 1.7, // データバックアップ
    "5005": 1.6, // 障害復旧計画

    // 対策レベルの重み（すべて同じ重みとする例）
    "1001": 1.3,
    "1004": 1.3,
    "1007": 1.3,
    "1010": 1.3,
    "2002": 1.3,
    "2005": 1.3,
    "2008": 1.3,
    "3003": 1.3,
    "3006": 1.3,
    "3009": 1.3,
    "4001": 1.3,
    "4004": 1.3,
    "4007": 1.3,
    "5002": 1.3,
    "5004": 1.3,
    "5006": 1.3,
    "5008": 1.3,
    "5010": 1.3,
    "5012": 1.3,
  }

  return (questionId: string) => weights[questionId] || 1.0
}

