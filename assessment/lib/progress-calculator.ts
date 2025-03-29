import { createClient } from "@/utils/supabase/client"
import type { Answer } from "@/types"

// Supabaseクライアントの初期化
const supabase = createClient()

// 進捗状況を計算するユーティリティ関数
export async function calculateDetailedProgress(answers: Answer[]) {
  // セクションごとの回答数を集計
  const sectionAnswers: Record<string, Answer[]> = {}

  // 回答をセクションごとに分類
  answers.forEach((answer) => {
    const questionId = answer.question_id
    const sectionId = Math.floor(Number(questionId) / 1000)
    const sectionIdStr = String(sectionId)

    if (!sectionAnswers[sectionIdStr]) {
      sectionAnswers[sectionIdStr] = []
    }

    sectionAnswers[sectionIdStr].push(answer)
  })

  // 必須質問の情報を取得
  const { data: requiredQuestions, error } = await supabase
    .from("questions")
    .select("id, section_id, required")
    .eq("required", true)

  if (error) {
    console.error("必須質問の取得に失敗しました:", error)
    return {
      sectionProgress: {},
      overallProgress: 0,
    }
  }

  // セクションごとの必須質問をグループ化
  const requiredQuestionsBySection: Record<string, any[]> = {}

  requiredQuestions.forEach((question) => {
    const sectionId = String(question.section_id)

    if (!requiredQuestionsBySection[sectionId]) {
      requiredQuestionsBySection[sectionId] = []
    }

    requiredQuestionsBySection[sectionId].push(question)
  })

  // セクションごとの進捗率を計算
  const sectionProgress: Record<string, number> = {}
  let totalAnsweredRequired = 0
  let totalRequiredQuestions = 0

  // 回答済みの質問IDを取得
  const answeredQuestionIds = new Set(answers.map((answer) => answer.question_id))

  Object.keys(requiredQuestionsBySection).forEach((sectionId) => {
    const requiredQuestionsInSection = requiredQuestionsBySection[sectionId] || []
    const totalRequired = requiredQuestionsInSection.length

    // このセクションで回答済みの必須質問数をカウント
    const answeredRequired = requiredQuestionsInSection.filter((question) =>
      answeredQuestionIds.has(question.id),
    ).length

    // セクションの進捗率を計算
    sectionProgress[sectionId] = totalRequired > 0 ? Math.round((answeredRequired / totalRequired) * 100) : 0

    totalAnsweredRequired += answeredRequired
    totalRequiredQuestions += totalRequired
  })

  // 全体の進捗率
  const overallProgress =
    totalRequiredQuestions > 0 ? Math.round((totalAnsweredRequired / totalRequiredQuestions) * 100) : 0

  return {
    sectionProgress,
    overallProgress,
  }
}

// 特定のセクションの進捗状況を計算する関数
export async function calculateSectionProgress(answers: Answer[], sectionId: string): Promise<number> {
  // 必須質問の情報を取得
  const { data: requiredQuestions, error } = await supabase
    .from("questions")
    .select("id")
    .eq("required", true)
    .eq("section_id", sectionId)

  if (error) {
    console.error(`セクション${sectionId}の必須質問の取得に失敗しました:`, error)
    return 0
  }

  // 必須質問がない場合は100%とする
  if (requiredQuestions.length === 0) {
    return 100
  }

  // セクション内の回答を抽出
  const sectionAnswers = answers.filter((answer) => {
    const questionId = answer.question_id
    const answerSectionId = Math.floor(Number(questionId) / 1000)
    return String(answerSectionId) === sectionId
  })

  // 回答済みの質問IDを取得
  const answeredQuestionIds = new Set(sectionAnswers.map((a) => a.question_id))

  // 回答済みの必須質問数をカウント
  const answeredRequired = requiredQuestions.filter((question) => answeredQuestionIds.has(question.id)).length

  // 進捗率を計算（0～100の整数）
  return Math.round((answeredRequired / requiredQuestions.length) * 100)
}

// ステッパーの進捗状況を計算する関数
export async function calculateStepperProgress(answers: Answer[]): Promise<Record<string, number>> {
  // 必須質問の情報を取得
  const { data: requiredQuestions, error } = await supabase
    .from("questions")
    .select("id, section_id, required")
    .eq("required", true)

  if (error) {
    console.error("必須質問の取得に失敗しました:", error)
    return {}
  }

  // セクションごとの必須質問をグループ化
  const requiredQuestionsBySection: Record<string, any[]> = {}

  requiredQuestions.forEach((question) => {
    const sectionId = String(question.section_id)

    if (!requiredQuestionsBySection[sectionId]) {
      requiredQuestionsBySection[sectionId] = []
    }

    requiredQuestionsBySection[sectionId].push(question)
  })

  // 回答済みの質問IDを取得
  const answeredQuestionIds = new Set(answers.map((answer) => answer.question_id))

  // セクションごとの進捗率を計算
  const sectionProgress: Record<string, number> = {}

  Object.keys(requiredQuestionsBySection).forEach((sectionId) => {
    const requiredQuestionsInSection = requiredQuestionsBySection[sectionId] || []
    const totalRequired = requiredQuestionsInSection.length

    // このセクションで回答済みの必須質問数をカウント
    const answeredRequired = requiredQuestionsInSection.filter((question) =>
      answeredQuestionIds.has(question.id),
    ).length

    // セクションの進捗率を計算
    sectionProgress[sectionId] = totalRequired > 0 ? Math.round((answeredRequired / totalRequired) * 100) : 0
  })

  return sectionProgress
}

