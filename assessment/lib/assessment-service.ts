import { createClient } from "@/utils/supabase/client"
import type { FacilityData, AnswerData, RiskScoreData, Section, Question, Answer } from "@/types"

// Supabaseクライアントの初期化
const supabase = createClient()

// 開発用の固定モックユーザーID
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000000"

// セクション一覧を取得する関数
export async function fetchSections(): Promise<Section[]> {
  try {
    const { data, error } = await supabase.from("sections").select("*").order("id")

    if (error) {
      console.error("セクション一覧取得エラー:", error)
      return []
    }

    return (data as Section[]) || []
  } catch (error) {
    console.error("セクション一覧取得中の例外:", error)
    return []
  }
}

// 施設データを取得する関数
export async function getFacility(facilityId: string): Promise<FacilityData | null> {
  try {
    const { data, error } = await supabase.from("facilities").select("*").eq("id", facilityId).single()

    if (error) {
      console.error("施設取得エラー:", error)
      return null
    }

    return data as FacilityData
  } catch (error) {
    console.error("施設取得エラー:", error)
    return null
  }
}

// 全ての施設データを取得する関数
export async function getAllFacilities(userId: string): Promise<FacilityData[]> {
  try {
    // ユーザーIDに基づいて施設を取得（現在はユーザーIDを使用していない）
    const { data, error } = await supabase.from("facilities").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("施設一覧取得エラー:", error)
      return []
    }

    return (data as FacilityData[]) || []
  } catch (error) {
    console.error("施設一覧取得中の例外:", error)
    return []
  }
}

// リスクスコアを取得する関数
export async function getRiskScore(facilityId: string): Promise<RiskScoreData | null> {
  try {
    console.log(`getRiskScore: facilityId=${facilityId}のリスクスコアを取得します`)
    const { data, error } = await supabase.from("risk_scores").select("*").eq("facility_id", facilityId).maybeSingle()

    if (error) {
      console.error("リスクスコア取得エラー:", error)
      return null
    }

    console.log(`getRiskScore: リスクスコアを取得しました`, data)
    return data as RiskScoreData
  } catch (error) {
    console.error(`getRiskScore: 例外発生`, error)
    return null
  }
}

// リスクスコアを保存する関数
export async function saveRiskScore(riskScoreData: RiskScoreData): Promise<RiskScoreData | null> {
  try {
    console.log(`saveRiskScore: リスクスコアを保存します`, riskScoreData)
    const { data, error } = await supabase
      .from("risk_scores")
      .upsert(riskScoreData, { onConflict: "facility_id" })
      .select()
      .single()

    if (error) {
      console.error("リスクスコア保存エラー:", error)
      return null
    }

    console.log(`saveRiskScore: リスクスコアを保存しました`, data)
    return data as RiskScoreData
  } catch (error) {
    console.error(`saveRiskScore: 例外発生`, error)
    return null
  }
}

// 回答データを取得する関数
export async function getAnswers(facilityId: string): Promise<AnswerData[]> {
  try {
    console.log(`getAnswers: facilityId=${facilityId}の回答を取得します`)
    const { data, error } = await supabase.from("answers").select("*").eq("facility_id", facilityId)

    if (error) {
      console.error("回答取得エラー:", error)
      return []
    }

    console.log(`getAnswers: ${data?.length || 0}件の回答を取得しました`)
    return (data as AnswerData[]) || []
  } catch (error) {
    console.error(`getAnswers: 例外発生`, error)
    return []
  }
}

// getAnswers関数をgetSupabaseAnswersとしても再エクスポート
export const getSupabaseAnswers = getAnswers

// 施設の回答を取得する関数
export async function getAnswersForFacility(facilityId: string): Promise<Answer[]> {
  try {
    const { data, error } = await supabase.from("answers").select("*").eq("facility_id", facilityId)

    if (error) {
      console.error("施設の回答取得エラー:", error)
      return []
    }

    return (data as Answer[]) || []
  } catch (error) {
    console.error("施設の回答取得中の例外:", error)
    return []
  }
}

// セクションの回答を取得する関数
export async function getSectionAnswers(facilityId: string, sectionId: string): Promise<AnswerData[]> {
  try {
    const answers = await getAnswers(facilityId)

    // 質問IDからセクションIDを抽出して、指定されたセクションの回答のみをフィルタリング
    return answers.filter((answer) => {
      const questionId = answer.question_id
      const answerSectionId = Math.floor(Number(questionId) / 1000)
      return String(answerSectionId) === sectionId
    })
  } catch (error) {
    console.error(`getSectionAnswers: 例外発生`, error)
    return []
  }
}

// 評価IDとセクションIDに基づいて回答を取得する関数
export async function getAnswersForSection(assessmentId: string, sectionId: number): Promise<Answer[]> {
  try {
    console.log(`評価ID ${assessmentId}, セクションID ${sectionId} の回答を取得中...`)

    // facility_idカラムを使用してクエリを実行
    const { data, error } = await supabase.from("answers").select("*").eq("facility_id", assessmentId)

    if (error) {
      console.error("回答取得エラー:", error)
      throw new Error(`回答の取得中にエラーが発生しました: ${error.message}`)
    }

    if (!data || data.length === 0) {
      console.warn(`評価ID ${assessmentId} の回答が見つかりません`)
      return []
    }

    // 取得した回答から、指定されたセクションIDに対応する回答のみをフィルタリング
    const filteredAnswers = data.filter((answer) => {
      const questionId = answer.question_id
      const answerSectionId = extractSectionIdFromQuestionId(questionId)
      return answerSectionId === sectionId
    })

    console.log(`評価ID ${assessmentId}, セクションID ${sectionId} の回答を ${filteredAnswers.length} 件取得しました`)
    return filteredAnswers as Answer[]
  } catch (err) {
    console.error("回答取得中の例外:", err)
    return []
  }
}

// 施設の進捗状況を更新する関数
export async function updateFacilityProgress(facilityId: string, progress: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("facilities")
      .update({ progress, updated_at: new Date().toISOString() })
      .eq("id", facilityId)

    if (error) {
      console.error("進捗状況更新エラー:", error)
      return false
    }

    return true
  } catch (error) {
    console.error(`updateFacilityProgress: 例外発生`, error)
    return false
  }
}

// リスクスコアを計算して保存する関数
export async function calculateAndSaveRiskScore(facilityId: string) {
  try {
    // 回答データを取得
    const answers = await getAnswers(facilityId)
    console.log(`リスクスコア計算: ${answers.length}件の回答を取得しました`)

    // リスク要素ごとのスコアを初期化
    const probabilityScores: number[] = []
    const impactScores: number[] = []
    const mitigationScores: number[] = []

    // 質問情報を取得するための関数
    const getQuestionInfo = async (questionId: string) => {
      // 質問テーブルから基本情報を取得
      const { data, error } = await supabase.from("questions").select("*").eq("id", questionId).single()
      if (error) {
        console.error(`質問情報取得エラー: ${questionId}`, error)
        return null
      }
      return data
    }

    // 質問のオプション情報を取得するための関数
    const getQuestionOptions = async (questionId: string) => {
      // question_optionsテーブルから質問に関連するオプションを取得
      const { data, error } = await supabase
        .from("question_options") // 修正: questions_option → question_options
        .select("*")
        .eq("question_id", questionId)

      if (error) {
        console.error(`質問オプション取得エラー: ${questionId}`, error)
        return []
      }
      return data || []
    }

    // 各回答を処理してリスクスコアを計算
    for (const answer of answers) {
      // 質問情報を取得
      const question = await getQuestionInfo(answer.question_id)
      if (!question || !question.risk_factor) continue

      // スコアを計算
      let score = 3 // デフォルト値

      if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
        // 数値回答の場合は直接その値を使用（1-5の範囲に制限）
        score = Math.max(1, Math.min(5, answer.numeric_value))
      } else if (answer.selected_options && answer.selected_options.length > 0) {
        // 選択肢回答の場合
        const optionValue = answer.selected_options[0].value

        // 質問に関連するオプションを取得
        const options = await getQuestionOptions(answer.question_id)

        // 選択されたオプションを探す
        const selectedOption = options.find((opt) => opt.value === optionValue || opt.id === optionValue)

        if (selectedOption && selectedOption.risk_score !== null && selectedOption.risk_score !== undefined) {
          score = selectedOption.risk_score
          console.log(`オプション ${optionValue} のリスクスコア: ${score}`)
        } else {
          console.log(`オプション ${optionValue} のリスクスコアが見つかりません。デフォルト値 ${score} を使用します。`)
        }
      }

      // 対策レベルの場合はスコアを反転（高いほど良いため）
      if (question.risk_factor === "mitigation") {
        score = 6 - score
      }

      // リスク要素に基づいてスコアを分類
      if (question.risk_factor === "probability") {
        probabilityScores.push(score)
      } else if (question.risk_factor === "impact") {
        impactScores.push(score)
      } else if (question.risk_factor === "mitigation") {
        mitigationScores.push(score)
      }
    }

    // 各リスク要素の平均スコアを計算
    const calculateAverage = (scores: number[]) => {
      if (scores.length === 0) return 3 // デフォルト値
      return scores.reduce((sum, score) => sum + score, 0) / scores.length
    }

    const probabilityScore = calculateAverage(probabilityScores)
    const impactScore = calculateAverage(impactScores)
    const mitigationScore = calculateAverage(mitigationScores)

    // 総合スコアの計算（確率 x 影響度 ÷ 対策レベル）の公式に近い形で計算
    // ただし、0で割らないように注意
    const totalScore =
      mitigationScore > 0 ? (probabilityScore * impactScore) / mitigationScore : (probabilityScore * impactScore) / 1

    // スコアは1-5の範囲に正規化
    const normalizedTotalScore = Math.max(1, Math.min(5, totalScore))

    // リスクレベルを決定
    let riskLevel = "中"
    if (normalizedTotalScore < 2) {
      riskLevel = "低"
    } else if (normalizedTotalScore >= 4) {
      riskLevel = "高"
    }

    console.log(`計算されたリスクスコア:`, {
      probabilityScore,
      impactScore,
      mitigationScore,
      totalScore: normalizedTotalScore,
      riskLevel,
    })

    // リスクスコアをデータベースに保存
    const riskScoreData = {
      facility_id: facilityId,
      probability_score: probabilityScore,
      impact_score: impactScore,
      mitigation_score: mitigationScore,
      total_score: normalizedTotalScore,
      risk_level: riskLevel,
    }

    await saveRiskScore(riskScoreData)

    return {
      probabilityScore,
      impactScore,
      mitigationScore,
      totalScore: normalizedTotalScore,
      riskLevel,
    }
  } catch (error) {
    console.error("リスクスコア計算・保存エラー:", error)
    throw error
  }
}

// 新規評価を作成する関数
export async function createAssessment(datacenterName: string): Promise<string> {
  try {
    console.log(`新規評価を作成します: datacenterName=${datacenterName}`)

    const { data, error } = await supabase
      .from("facilities")
      .insert([
        {
          name: datacenterName,
          location: "未設定",
          assessor: "未設定",
          assessment_date: new Date().toISOString().split("T")[0],
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("新規評価作成エラー:", error)
      throw new Error(`新規評価の作成に失敗しました: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error("新規評価の作成に失敗しました: データが返されませんでした")
    }

    const newAssessmentId = data[0].id
    console.log(`新規評価を作成しました: id=${newAssessmentId}`)

    return newAssessmentId
  } catch (err) {
    console.error("新規評価作成中の例外:", err)
    throw err
  }
}

// 評価データを取得する関数
export async function getAssessmentById(assessmentId: string): Promise<any | null> {
  try {
    // 施設データを取得
    const facility = await getFacility(assessmentId)

    if (!facility) {
      return null
    }

    // 回答データを取得
    const answers = await getAnswers(assessmentId)

    // リスクスコアを取得
    const riskScore = await getRiskScore(assessmentId)

    // 評価データに変換して返す
    return {
      id: facility.id,
      name: facility.name,
      location: facility.location,
      assessor: facility.assessor,
      date: facility.assessment_date,
      progress: facility.progress || 0,
      createdAt: facility.created_at || new Date().toISOString(),
      updatedAt: facility.updated_at || new Date().toISOString(),
      answers: formatAnswers(answers),
      riskScore: riskScore
        ? {
            probabilityScore: riskScore.probability_score,
            impactScore: riskScore.impact_score,
            mitigationScore: riskScore.mitigation_score,
            totalScore: riskScore.total_score,
            riskLevel: riskScore.risk_level,
          }
        : undefined,
    }
  } catch (error) {
    console.error("評価データ取得エラー:", error)
    throw new Error("評価データの取得に失敗しました")
  }
}

// ユーザーの全評価データを取得する関数
export async function getAllUserAssessments(): Promise<any[]> {
  try {
    console.log("getAllUserAssessments: 開始")

    // 固定のモックユーザーIDを直接使用
    const userId = MOCK_USER_ID
    console.log("getAllUserAssessments: 固定ユーザーID使用", userId)

    // 施設データを取得
    const facilities = await getAllFacilities(userId)
    console.log("getAllUserAssessments: 取得した施設数", facilities.length)

    if (facilities.length === 0) {
      console.log("getAllUserAssessments: 施設が見つかりません")
      return []
    }

    // 各施設の評価データを取得
    const assessments = await Promise.all(
      facilities.map(async (facility) => {
        console.log("getAllUserAssessments: 施設データ処理", facility.id, facility.name)
        const answers = await getAnswers(facility.id)
        const riskScore = await getRiskScore(facility.id)

        return {
          id: facility.id,
          name: facility.name,
          location: facility.location,
          assessor: facility.assessor,
          date: facility.assessment_date,
          progress: facility.progress || 0,
          createdAt: facility.created_at || new Date().toISOString(),
          updatedAt: facility.updated_at || new Date().toISOString(),
          answers: formatAnswers(answers),
          riskScore: riskScore
            ? {
                probabilityScore: riskScore.probability_score,
                impactScore: riskScore.impact_score,
                mitigationScore: riskScore.mitigation_score,
                totalScore: riskScore.total_score,
                riskLevel: riskScore.risk_level,
              }
            : undefined,
        }
      }),
    )

    console.log("getAllUserAssessments: 変換後の評価データ数", assessments.length)
    return assessments
  } catch (error) {
    console.error("評価データ一覧取得エラー:", error)
    throw new Error("評価データ一覧の取得に失敗しました")
  }
}

// 回答データを整形する関数
function formatAnswers(answers: AnswerData[] = []): Record<string, Record<string, any>> {
  const formattedAnswers: Record<string, Record<string, any>> = {}

  answers.forEach((answer) => {
    // 質問IDからセクションIDを抽出
    const questionId = answer.question_id
    const sectionId = Math.floor(Number(questionId) / 1000)

    // セクションIDを文字列として扱う（オブジェクトのキーは文字列）
    const sectionIdStr = String(sectionId)

    // セクションが存在しない場合は初期化
    if (!formattedAnswers[sectionIdStr]) {
      formattedAnswers[sectionIdStr] = {}
    }

    // 回答の値を適切に設定
    if (answer.selected_options) {
      formattedAnswers[sectionIdStr][questionId] = answer.selected_options
    } else if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
      formattedAnswers[sectionIdStr][questionId] = answer.numeric_value
    } else {
      formattedAnswers[sectionIdStr][questionId] = answer.value
    }
  })

  return formattedAnswers
}

// リスク推奨事項を取得する関数
export async function getRiskRecommendations(facilityId: string) {
  try {
    // リスクスコアを取得
    const riskScore = await getRiskScore(facilityId)

    if (!riskScore) {
      console.log("リスクスコアが見つかりません")
      return null
    }

    // 回答データを取得
    const answers = await getAnswers(facilityId)

    // 高リスク項目（スコア >= 4）と中リスク項目（2 <= スコア < 4）を抽出
    // 実際のデータベースからリスクスコアを取得する必要があります

    // 各カテゴリの一般的な推奨事項
    const generalRecommendations = {
      probability: "発生確率を下げるために、設備の更新や定期的な点検を強化してください。",
      impact: "影響度を軽減するために、バックアップ体制の強化や代替手段の確保を検討してください。",
      mitigation: "対策レベルを向上させるために、リスク管理体制の見直しや訓練の実施を検討してください。",
      total: "総合的なリスク低減のために、高リスク項目から優先的に対策を実施してください。",
    }

    return {
      scores: {
        probability: riskScore.probability_score,
        impact: riskScore.impact_score,
        mitigation: riskScore.mitigation_score,
        total: riskScore.total_score,
      },
      riskLevel: riskScore.risk_level,
      highRiskItems: {
        probability: [],
        impact: [],
        mitigation: [],
      },
      mediumRiskItems: {
        probability: [],
        impact: [],
        mitigation: [],
      },
      generalRecommendations,
    }
  } catch (error) {
    console.error("リスク推奨事項取得エラー:", error)
    return null
  }
}

// 質問一覧を取得する関数
export async function fetchQuestions(): Promise<Question[]> {
  try {
    const { data, error } = await supabase.from("questions").select("*").order("id")

    if (error) {
      console.error("質問一覧取得エラー:", error)
      return []
    }

    return (data as Question[]) || []
  } catch (error) {
    console.error("質問一覧取得中の例外:", error)
    return []
  }
}

// 全てのセクションを取得する関数
export async function getAllSections(): Promise<Section[]> {
  try {
    const { data, error } = await supabase.from("sections").select("*").order("id")

    if (error) {
      console.error("セクション一覧取得エラー:", error)
      return []
    }

    return (data as Section[]) || []
  } catch (error) {
    console.error("セクション一覧取得中の例外:", error)
    return []
  }
}

// 質問IDからセクションIDを抽出する関数
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

// 回答データを整形する部分を修正し、エクスポート
export function convertFacilityToAssessment(
  facility: FacilityData,
  answers: AnswerData[] = [],
  riskScore?: RiskScoreData,
): any {
  // 回答データを整形
  const formattedAnswers: Record<string, Record<string, any>> = {}

  answers.forEach((answer) => {
    // 質問IDからセクションIDを抽出
    const questionId = answer.question_id
    const sectionId = extractSectionIdFromQuestionId(questionId)

    // セクションIDを文字列として扱う（オブジェクトのキーは文字列）
    const sectionIdStr = String(sectionId)

    // セクションが存在しない場合は初期化
    if (!formattedAnswers[sectionIdStr]) {
      formattedAnswers[sectionIdStr] = {}
    }

    // 回答の値を適切に設定
    if (answer.selected_options) {
      formattedAnswers[sectionIdStr][questionId] = answer.selected_options
    } else if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
      formattedAnswers[sectionIdStr][questionId] = answer.numeric_value
    } else {
      formattedAnswers[sectionIdStr][questionId] = answer.value
    }
  })

  // リスクスコアを整形
  const formattedRiskScore = riskScore
    ? {
        probabilityScore: riskScore.probability_score,
        impactScore: riskScore.impact_score,
        mitigationScore: riskScore.mitigation_score,
        totalScore: riskScore.total_score,
        riskLevel: riskScore.risk_level,
      }
    : undefined

  // 評価データを返す
  return {
    id: facility.id,
    name: facility.name,
    location: facility.location,
    assessor: facility.assessor,
    date: facility.assessment_date,
    progress: facility.progress || 0,
    createdAt: facility.created_at || new Date().toISOString(),
    updatedAt: facility.updated_at || new Date().toISOString(),
    answers: formattedAnswers,
    riskScore: formattedRiskScore,
  }
}

// セクションIDに基づいて質問を取得する関数
export async function getQuestionsForSection(sectionId: number): Promise<Question[]> {
  try {
    console.log(`getQuestionsForSection: セクションID ${sectionId} の質問を取得開始`)

    // セクションIDが有効かチェック
    if (!sectionId || isNaN(sectionId)) {
      console.error(`getQuestionsForSection: 無効なセクションID: ${sectionId}`)
      return []
    }

    // 指定されたセクションIDの質問を取得
    const { data, error } = await supabase.from("questions").select("*").eq("section_id", sectionId).order("id")

    if (error) {
      console.error(`getQuestionsForSection: 質問取得エラー:`, error)
      return []
    }

    if (!data || data.length === 0) {
      console.warn(`getQuestionsForSection: セクションID ${sectionId} の質問が見つかりません`)
      return []
    }

    console.log(`getQuestionsForSection: セクションID ${sectionId} の質問を ${data.length} 件取得しました`)

    return data as Question[]
  } catch (err) {
    console.error("getQuestionsForSection: 全体処理中の例外:", err)
    return []
  }
}

// セクションIDに基づいてセクション情報を取得する関数
export async function getSectionById(sectionId: number): Promise<Section | null> {
  try {
    console.log(`セクションID ${sectionId} の情報を取得中...`)

    const { data, error } = await supabase.from("sections").select("*").eq("id", sectionId).single()

    if (error) {
      console.error("セクション取得エラー:", error)
      throw new Error(`セクションの取得中にエラーが発生しました: ${error.message}`)
    }

    if (!data) {
      console.warn(`セクションID ${sectionId} が見つかりません`)
      return null
    }

    console.log(`セクションID ${sectionId} の情報を取得しました:`, data)
    return data as Section
  } catch (err) {
    console.error("セクション取得中の例外:", err)
    return null
  }
}

// 特定の評価のリスクスコアを取得する関数
export async function getAssessmentRiskScore(assessmentId: string): Promise<{
  probabilityScore: number
  impactScore: number
  mitigationScore: number
  totalScore: number
  riskLevel: string
} | null> {
  try {
    const riskScore = await getRiskScore(assessmentId)

    if (!riskScore) {
      return null
    }

    return {
      probabilityScore: riskScore.probability_score,
      impactScore: riskScore.impact_score,
      mitigationScore: riskScore.mitigation_score,
      totalScore: riskScore.total_score,
      riskLevel: riskScore.risk_level,
    }
  } catch (error) {
    console.error("リスクスコア取得エラー:", error)
    throw new Error("リスクスコアの取得に失敗しました")
  }
}

// ローカルストレージに回答を保存する関数
export function saveAnswersToLocalStorage(assessmentId: string, sectionId: number, answers: Answer[]): void {
  try {
    if (typeof window !== "undefined") {
      const key = `answers_${assessmentId}_${sectionId}`
      localStorage.setItem(key, JSON.stringify(answers))
    }
  } catch (error) {
    console.error("ローカルストレージへの回答保存エラー:", error)
  }
}

// ローカルストレージから回答を取得する関数
export function getAnswersFromLocalStorage(assessmentId: string, sectionId: number): Answer[] {
  try {
    if (typeof window !== "undefined") {
      const key = `answers_${assessmentId}_${sectionId}`
      const storedData = localStorage.getItem(key)

      if (storedData) {
        return JSON.parse(storedData)
      }
    }
    return []
  } catch (error) {
    console.error("ローカルストレージからの回答取得エラー:", error)
    return []
  }
}

// セクションの回答をSupabaseに保存する関数
export async function saveSectionAnswersToSupabase(
  assessmentId: string,
  sectionId: number,
  answers: Answer[],
  datacenterName: string,
): Promise<void> {
  try {
    console.log(`評価ID ${assessmentId}, セクションID ${sectionId} の回答を保存中...`)
    console.log("保存する回答データ:", answers)

    // まず、ローカルストレージに保存（フォールバック用）
    saveAnswersToLocalStorage(assessmentId, sectionId, answers)
    console.log("回答をローカルストレージに保存しました")

    // 既存の回答を削除 - section_idカラムがないので、question_idからセクションIDを抽出する
    // まず、この施設の全回答を取得
    try {
      const { data: existingAnswers, error: fetchError } = await supabase
        .from("answers")
        .select("*")
        .eq("facility_id", assessmentId)

      if (fetchError) {
        console.error("既存回答取得エラー:", fetchError)
        // エラーが発生した場合でも処理を続行し、新しい回答を保存する
        console.warn("既存の回答の取得に失敗しましたが、新しい回答の保存を試みます")
      } else {
        // 削除対象の回答IDを特定（このセクションに属する回答のみ）
        const answersToDelete = existingAnswers
          .filter((answer) => extractSectionIdFromQuestionId(answer.question_id) === sectionId)
          .map((answer) => answer.id)

        if (answersToDelete.length > 0) {
          console.log(`削除対象の回答: ${answersToDelete.length}件`)

          // 回答を削除
          try {
            const { error: deleteError } = await supabase.from("answers").delete().in("id", answersToDelete)

            if (deleteError) {
              console.error("回答削除エラー:", deleteError)
              console.warn("既存の回答の削除に失敗しましたが、新しい回答の保存を試みます")
            }
          } catch (deleteErr) {
            console.error("回答削除中の例外:", deleteErr)
            console.warn("既存の回答の削除に失敗しましたが、新しい回答の保存を試みます")
          }
        } else {
          console.log(`削除対象の回答はありません`)
        }
      }
    } catch (fetchErr) {
      console.error("既存回答取得中の例外:", fetchErr)
      console.warn("既存の回答の取得に失敗しましたが、新しい回答の保存を試みます")
    }

    // 新しい回答を挿入
    if (answers && answers.length > 0) {
      try {
        // 回答データから必要なフィールドのみを抽出
        const cleanAnswers = answers.map((answer) => ({
          facility_id: assessmentId,
          question_id: answer.question_id,
          value: answer.value,
          numeric_value: answer.numeric_value,
          selected_options:
            Array.isArray(answer.selected_options) && answer.selected_options.length > 0
              ? answer.selected_options
              : null,
        }))

        console.log("Supabaseに保存するデータ:", cleanAnswers)

        // Supabaseに保存を試みる
        const { error: insertError } = await supabase.from("answers").insert(cleanAnswers)

        if (insertError) {
          console.error("回答挿入エラー:", insertError)

          // トリガーに関連するエラーの場合は特別なメッセージを表示
          if (
            insertError.message &&
            (insertError.message.includes("risk_score") ||
              insertError.message.includes("ambiguous") ||
              insertError.message.includes("trigger"))
          ) {
            console.warn("トリガーに関連するエラーが発生しました。トリガーの修正または無効化が必要です。")
            console.warn("Supabaseダッシュボードで以下のSQLを実行してください:")
            console.warn("ALTER TABLE answers DISABLE TRIGGER answer_risk_score_trigger;")
            console.warn("ALTER TABLE answers DISABLE TRIGGER trigger_update_risk_scores;")

            // 代替手段として、ローカルストレージのみに保存されたことを通知
            console.warn("回答はローカルストレージにのみ保存されました。管理者に連絡してください。")
          } else {
            // その他のエラーの場合
            console.error(`新しい回答の挿入中にエラーが発生しました: ${insertError.message}`)
            console.warn("回答はローカルストレージにのみ保存されました。")
          }

          // エラーがあっても処理を続行（ローカルストレージには保存済み）
          return
        }

        console.log(`Supabaseに回答を ${answers.length} 件保存しました`)

        // 回答保存後にリスクスコアを手動で計算（トリガーが無効化されている場合のバックアップ）
        try {
          console.log("回答保存後のリスクスコアを計算します")
          await calculateAndSaveRiskScore(assessmentId)
          console.log("リスクスコアの計算が完了しました")
        } catch (riskScoreError) {
          console.error("リスクスコアの計算中にエラーが発生しました:", riskScoreError)
          // リスクスコアの計算に失敗しても、回答の保存自体は成功したとみなす
        }
      } catch (insertErr) {
        console.error("回答挿入中の例外:", insertErr)
        console.warn("Supabaseへの保存に失敗しましたが、ローカルストレージには保存されています")

        // Supabaseへの保存に失敗した場合でも、ローカルストレージには保存されているので
        // エラーを投げずに処理を続行する
        return
      }
    }

    console.log(`評価ID ${assessmentId}, セクションID ${sectionId} の回答を保存しました`)

    // 回答保存後に進捗率を更新
    try {
      console.log("回答保存後の進捗率を更新します")
      await updateAssessmentProgress(assessmentId)
      console.log("進捗率の更新が完了しました")
    } catch (progressError) {
      console.error("進捗率の更新中にエラーが発生しました:", progressError)
      // 進捗率の更新に失敗しても、回答の保存自体は成功したとみなす
    }
  } catch (err) {
    console.error("回答保存中の例外:", err)
    // エラーが発生しても、ローカルストレージには保存されているので
    // ユーザーにはエラーを表示するが、処理は続行する
    console.warn("エラーが発生しましたが、回答はローカルストレージに保存されています")
  }
}

// 進捗状況を計算して更新する関数
export async function updateAssessmentProgress(facilityId: string): Promise<number> {
  try {
    console.log(`進捗状況を更新します: facilityId=${facilityId}`)

    // 施設データを取得
    const facility = await getFacility(facilityId)
    if (!facility) {
      console.error("施設データが見つかりません")
      return 0 // デフォルト値として0を返す
    }

    // 回答データを取得
    const answers = await getAnswers(facilityId)
    console.log(`取得した回答データ: ${answers.length}件`)

    // 必須質問の総数を取得
    const { data: requiredQuestions, error } = await supabase.from("questions").select("id").eq("required", true) // is_required から required に修正

    if (error) {
      console.error("必須質問の取得に失敗しました:", error)
      return 0
    }

    // 必須質問の総数
    const totalRequiredQuestions = requiredQuestions.length
    console.log(`必須質問の総数: ${totalRequiredQuestions}件`)

    // 回答済みの必須質問数を計算
    // 回答済みの質問IDを取得
    const answeredQuestionIds = new Set(answers.map((answer) => answer.question_id))

    // 回答済みの必須質問数をカウント
    const answeredRequiredQuestions = requiredQuestions.filter((question) =>
      answeredQuestionIds.has(question.id),
    ).length

    console.log(`回答済みの必須質問数: ${answeredRequiredQuestions}件`)

    // 進捗率を計算
    const progress =
      totalRequiredQuestions > 0 ? Math.round((answeredRequiredQuestions / totalRequiredQuestions) * 100) : 0

    console.log("計算された進捗率:", progress)

    // 進捗状況をSupabaseに保存
    await updateFacilityProgress(facilityId, progress)

    console.log(`進捗状況の更新が完了しました: ${facilityId}, 進捗率=${progress}%`)

    return progress
  } catch (error) {
    console.error("進捗状況の更新に失敗しました:", error)
    return 0 // エラー時はデフォルト値として0を返す
  }
}

// この関数を追加して、各セクションの質問数をログに出力
export async function logQuestionCounts() {
  try {
    // 各セクションの質問数を取得
    for (let sectionId = 1; sectionId <= 5; sectionId++) {
      const { data, error } = await supabase.from("questions").select("id").eq("section_id", sectionId)

      if (error) {
        console.error(`セクション${sectionId}の質問取得エラー:`, error)
      } else {
        console.log(`セクション${sectionId}の質問数: ${data.length}`)
      }
    }
  } catch (error) {
    console.error("質問数取得エラー:", error)
  }
}

// 特定のセクションの質問IDをログに出力する関数
export async function logSectionQuestions(sectionId: number) {
  try {
    console.log(`セクション${sectionId}の質問を取得します...`)

    const { data, error } = await supabase.from("questions").select("id, text").eq("section_id", sectionId).order("id")

    if (error) {
      console.error(`セクション${sectionId}の質問取得エラー:`, error)
    } else {
      console.log(`セクション${sectionId}の質問: ${data.length}件`)
      data.forEach((q) => {
        console.log(`ID: ${q.id}, テキスト: ${q.text}`)
      })
    }
  } catch (error) {
    console.error(`セクション${sectionId}の質問取得エラー:`, error)
  }
}

// 特定の評価の回答をセクションごとに集計してログに出力する関数
export async function logAssessmentAnswers(assessmentId: string) {
  try {
    console.log(`評価ID ${assessmentId} の回答を取得します...`)

    const { data, error } = await supabase.from("answers").select("*").eq("facility_id", assessmentId)

    if (error) {
      console.error(`評価ID ${assessmentId} の回答取得エラー:`, error)
      return
    }

    if (!data || data.length === 0) {
      console.log(`評価ID ${assessmentId} の回答はありません`)
      return
    }

    console.log(`評価ID ${assessmentId} の回答: ${data.length}件`)

    // セクションごとに回答を集計
    const answersBySection: Record<number, Answer[]> = {}

    data.forEach((answer) => {
      const questionId = answer.question_id
      const sectionId = Math.floor(questionId / 1000)

      if (!answersBySection[sectionId]) {
        answersBySection[sectionId] = []
      }

      answersBySection[sectionId].push(answer)
    })

    // セクションごとの回答数を出力
    Object.keys(answersBySection).forEach((sectionIdStr) => {
      const sectionId = Number(sectionIdStr)
      const sectionAnswers = answersBySection[sectionId]
      const uniqueQuestionIds = new Set(sectionAnswers.map((a) => a.question_id))

      console.log(
        `セクション${sectionId}の回答: ${sectionAnswers.length}件（ユニーク質問数: ${uniqueQuestionIds.size}件）`,
      )
      console.log(`回答済み質問ID: ${Array.from(uniqueQuestionIds).sort().join(", ")}`)
    })
  } catch (error) {
    console.error(`評価ID ${assessmentId} の回答取得エラー:`, error)
  }
}

