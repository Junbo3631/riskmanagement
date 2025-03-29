import { supabase } from "@/lib/supabase"
import type { Question } from "@/types/risk-assessment"
import { getAllUserAssessments } from "@/lib/assessment-service"
import { getAnswers } from "@/lib/supabase-service"

// セクション情報（静的データ）
export const allSections = [
  { id: 1, name: "基本情報", weight: 0.1 },
  { id: 2, name: "物理的セキュリティ", weight: 0.25 },
  { id: 3, name: "環境リスク", weight: 0.3 },
  { id: 4, name: "運用管理", weight: 0.2 },
  { id: 5, name: "事業継続性", weight: 0.15 },
]

// リスクスコア計算のための重み付け
const IMPORTANCE_WEIGHTS = {
  low: 0.5,
  medium: 1,
  high: 2,
}

// 質問タイプごとのスコア計算関数
const scoreCalculators = {
  // 選択肢タイプの質問のスコア計算
  select: (answer: any, question: Question): number => {
    if (!answer) return 0

    // 選択された選択肢のリスクレベルに基づいてスコア計算
    const selectedOption = question.options?.find((opt) => opt.value === answer)

    if (!selectedOption) return 0

    switch (selectedOption.risk_level) {
      case "low":
        return 25
      case "medium":
        return 50
      case "high":
        return 100
      default:
        return 0
    }
  },

  // 複数選択タイプの質問のスコア計算
  multiselect: (answer: any, question: Question): number => {
    if (!answer || !Array.isArray(answer) || answer.length === 0) return 0

    // 選択された選択肢のリスクレベルに基づいてスコア計算
    const selectedOptions = answer.map((value) => question.options?.find((opt) => opt.value === value)).filter(Boolean)

    if (selectedOptions.length === 0) return 0

    // 高リスクの選択肢の数をカウント
    const highRiskCount = selectedOptions.filter((opt) => opt?.risk_level === "high").length

    // 高リスク選択肢の割合でスコア計算
    return highRiskCount > 0 ? (highRiskCount / selectedOptions.length) * 100 : 0
  },

  // 数値入力タイプの質問のスコア計算
  number: (answer: any, question: Question): number => {
    if (answer === undefined || answer === null) return 0

    const numValue = typeof answer === "number" ? answer : Number.parseFloat(answer)
    if (isNaN(numValue)) return 0

    // 閾値に基づいてスコア計算
    const thresholds = question.thresholds || []
    for (const threshold of thresholds) {
      if (
        (threshold.operator === ">" && numValue > threshold.value) ||
        (threshold.operator === ">=" && numValue >= threshold.value) ||
        (threshold.operator === "<" && numValue < threshold.value) ||
        (threshold.operator === "<=" && numValue <= threshold.value) ||
        (threshold.operator === "=" && numValue === threshold.value)
      ) {
        switch (threshold.risk_level) {
          case "low":
            return 25
          case "medium":
            return 50
          case "high":
            return 100
          default:
            return 0
        }
      }
    }

    return 0
  },

  // テキスト入力タイプの質問のスコア計算（リスクスコアに影響しない）
  text: () => 0,

  // 日付入力タイプの質問のスコア計算（リスクスコアに影響しない）
  date: () => 0,
}

// デフォルトのスコア計算関数
const defaultScoreCalculator = () => 0

// 質問のスコアを計算
export function calculateQuestionScore(answer: any, question: Question): number {
  // 質問タイプに応じたスコア計算関数を取得
  const calculator = scoreCalculators[question.type as keyof typeof scoreCalculators] || defaultScoreCalculator

  // スコアを計算
  const rawScore = calculator(answer, question)

  // 重要度による重み付け
  const importanceWeight = IMPORTANCE_WEIGHTS[question.importance || "medium"]

  return rawScore * importanceWeight
}

// セクションのスコアを計算
export function calculateSectionScore(
  answers: Record<string, any>,
  questions: Question[],
): { score: number; answeredQuestions: number; totalQuestions: number } {
  if (!questions || questions.length === 0) {
    return { score: 0, answeredQuestions: 0, totalQuestions: 0 }
  }

  let totalScore = 0
  let totalWeight = 0
  let answeredQuestions = 0

  questions.forEach((question) => {
    const answer = answers[question.id]

    // 回答がある場合のみスコア計算
    if (answer !== undefined) {
      const score = calculateQuestionScore(answer, question)
      const weight = IMPORTANCE_WEIGHTS[question.importance || "medium"]

      totalScore += score
      totalWeight += weight
      answeredQuestions++
    }
  })

  // 重み付け平均を計算
  const weightedScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0

  return {
    score: weightedScore,
    answeredQuestions,
    totalQuestions: questions.length,
  }
}

// 総合リスクスコアを計算
export async function calculateRiskScore(facilityId: string): Promise<{
  totalScore: number
  riskLevel: string
  sectionScores: Record<string, { score: number; weight: number; answeredQuestions: number; totalQuestions: number }>
  debugInfo: any
}> {
  try {
    // 修正: 施設データと回答データを別々に取得
    // 施設データを取得
    const { data: facility, error: facilityError } = await supabase
      .from("facilities")
      .select("*")
      .eq("id", facilityId)
      .single()

    if (facilityError) {
      console.error("Error fetching facility:", facilityError)
      throw facilityError
    }

    if (!facility) {
      throw new Error("施設データが見つかりません")
    }

    // 回答データを取得
    const answers = await getAnswers(facilityId)

    if (!answers || answers.length === 0) {
      throw new Error("回答データが見つかりません")
    }

    // 回答データを整形
    const formattedAnswers: Record<string, Record<string, any>> = {}
    answers.forEach((answer: any) => {
      const questionId = answer.question_id
      const sectionId = Math.floor(Number(questionId) / 1000).toString()

      if (!formattedAnswers[sectionId]) {
        formattedAnswers[sectionId] = {}
      }

      // 回答値を設定
      if (answer.selected_options && answer.selected_options.length > 0) {
        formattedAnswers[sectionId][questionId] =
          answer.selected_options.length === 1 ? answer.selected_options[0] : answer.selected_options
      } else if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
        formattedAnswers[sectionId][questionId] = answer.numeric_value
      } else if (answer.value) {
        formattedAnswers[sectionId][questionId] = answer.value
      }
    })

    const sectionScores: Record<
      string,
      { score: number; weight: number; answeredQuestions: number; totalQuestions: number }
    > = {}
    let totalWeightedScore = 0
    const debugInfo: any = {
      facility: facility,
      rawAnswers: answers,
      formattedAnswers: formattedAnswers,
    }

    // 各セクションのスコアを計算
    for (const section of allSections) {
      const sectionId = section.id.toString()

      // セクションの質問を取得
      const { data: questions, error } = await supabase
        .from("questions")
        .select("*")
        .eq("section_id", section.id)
        .order("id", { ascending: true })

      if (error) {
        console.error(`Error fetching questions for section ${sectionId}:`, error)
        continue
      }

      // セクションの回答を取得
      const sectionAnswers = formattedAnswers[sectionId] || {}

      // セクションのスコアを計算
      const sectionResult = calculateSectionScore(sectionAnswers, questions)
      const sectionWeight = section.weight || 0

      sectionScores[sectionId] = {
        score: sectionResult.score,
        weight: sectionWeight,
        answeredQuestions: sectionResult.answeredQuestions,
        totalQuestions: sectionResult.totalQuestions,
      }

      // 総合スコアに加算
      totalWeightedScore += sectionResult.score * sectionWeight

      // デバッグ情報を追加
      debugInfo[`section_${sectionId}`] = {
        name: section.name,
        weight: sectionWeight,
        rawScore: sectionResult.score,
        weightedScore: sectionResult.score * sectionWeight,
        answeredQuestions: sectionResult.answeredQuestions,
        totalQuestions: sectionResult.totalQuestions,
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          importance: q.importance,
          answer: sectionAnswers[q.id],
          score: sectionAnswers[q.id] !== undefined ? calculateQuestionScore(sectionAnswers[q.id], q) : 0,
        })),
      }
    }

    // リスクレベルを決定
    let riskLevel = "低"
    if (totalWeightedScore >= 75) {
      riskLevel = "高"
    } else if (totalWeightedScore >= 50) {
      riskLevel = "中"
    }

    // デバッグ情報を追加
    debugInfo.totalScore = totalWeightedScore

    return {
      totalScore: Math.round(totalWeightedScore),
      riskLevel,
      sectionScores,
      debugInfo,
    }
  } catch (error) {
    console.error("Error calculating risk score:", error)
    throw error
  }
}

// 広島データセンターのリスクスコアを検証
export async function validateHiroshimaRiskScore(): Promise<{
  currentScore: any
  calculatedScore: { totalScore: number; riskLevel: string }
  sectionScores: Record<string, number>
  details: any
  isMatching: boolean
}> {
  try {
    // 全ての評価を取得
    const assessments = await getAllUserAssessments()

    // 広島データセンターの評価を検索
    const hiroshimaAssessment = assessments.find((a) => a.name?.includes("広島") || a.location?.includes("広島"))

    if (!hiroshimaAssessment) {
      throw new Error("広島データセンターの評価が見つかりません")
    }

    const facilityId = hiroshimaAssessment.id

    // 現在のリスクスコアを取得
    const { data: riskScoreData, error: riskScoreError } = await supabase
      .from("risk_scores")
      .select("*")
      .eq("facility_id", facilityId)
      .maybeSingle()

    if (riskScoreError) {
      console.error("Error fetching current risk score:", riskScoreError)
      throw riskScoreError
    }

    // リスクスコアを再計算
    const { totalScore, riskLevel, sectionScores, debugInfo } = await calculateRiskScore(facilityId)

    // セクションスコアを簡略化
    const simplifiedSectionScores: Record<string, number> = {}
    Object.entries(sectionScores).forEach(([sectionId, data]) => {
      simplifiedSectionScores[sectionId] = Math.round(data.score)
    })

    // 現在のスコアと計算されたスコアを比較
    const currentScore = riskScoreData || null
    const calculatedScore = { totalScore, riskLevel }
    const isMatching = currentScore ? currentScore.total_score === totalScore : false

    return {
      currentScore,
      calculatedScore,
      sectionScores: simplifiedSectionScores,
      details: debugInfo,
      isMatching,
    }
  } catch (error) {
    console.error("Error validating Hiroshima risk score:", error)
    throw error
  }
}

