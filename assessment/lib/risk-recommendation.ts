import { getAnswers, getRiskScore } from "./assessment-service"
import type { Question } from "@/lib/db-schema"
import { supabase } from "@/lib/supabase"

// リスク項目の型定義
interface RiskItem {
  questionId: string
  question: string
  answer: string | string[]
  riskScore: number
  recommendation: string
}

// カテゴリー別推奨事項の型定義
interface CategoryRecommendations {
  highRiskItems: RiskItem[]
  mediumRiskItems: RiskItem[]
  generalRecommendation: string
}

// 全カテゴリーの推奨事項の型定義
interface RiskRecommendations {
  probabilityRecommendations: CategoryRecommendations
  impactRecommendations: CategoryRecommendations
  mitigationRecommendations: CategoryRecommendations
  totalRiskRecommendations: CategoryRecommendations
}

// 質問データを取得する関数
async function getQuestions(): Promise<Question[]> {
  try {
    // Supabaseから質問を取得
    const { data: questions, error } = await supabase.from("questions").select("*")

    if (error) {
      console.error("質問データの取得エラー:", error)
      return []
    }

    return questions || []
  } catch (error) {
    console.error("質問データの取得に失敗しました:", error)
    return []
  }
}

// question_optionsテーブルからオプションを取得する関数
async function getQuestionOptions(): Promise<any[]> {
  try {
    const { data: options, error } = await supabase.from("question_options").select("*")

    if (error) {
      console.error("オプションデータの取得エラー:", error)
      return []
    }

    return options || []
  } catch (error) {
    console.error("オプションデータの取得に失敗しました:", error)
    return []
  }
}

// 発生確率に基づく推奨事項を生成する関数
function generateProbabilityRecommendations(
  highRiskItems: RiskItem[],
  mediumRiskItems: RiskItem[],
): CategoryRecommendations {
  return {
    highRiskItems,
    mediumRiskItems,
    generalRecommendation:
      "発生確率が高いリスク項目に対しては、予防的対策の強化が重要です。定期的な点検、早期警戒システムの導入、予備システムの確保などを検討してください。",
  }
}

// 影響度に基づく推奨事項を生成する関数
function generateImpactRecommendations(
  highRiskItems: RiskItem[],
  mediumRiskItems: RiskItem[],
): CategoryRecommendations {
  return {
    highRiskItems,
    mediumRiskItems,
    generalRecommendation:
      "影響度が高いリスク項目に対しては、影響緩和策の追加が重要です。障害発生時の影響範囲を限定する対策、代替手段の確保、復旧プロセスの最適化などを検討してください。",
  }
}

// 対策レベルに基づく推奨事項を生成する関数
function generateMitigationRecommendations(
  highRiskItems: RiskItem[],
  mediumRiskItems: RiskItem[],
): CategoryRecommendations {
  return {
    highRiskItems,
    mediumRiskItems,
    generalRecommendation:
      "対策レベルが低いリスク項目に対しては、具体的な対策実装の提案が重要です。業界標準やベストプラクティスに基づいた対策の導入、専門家によるレビュー、定期的な改善サイクルの確立などを検討してください。",
  }
}

// 総合リスクに基づく推奨事項を生成する関数
function generateTotalRiskRecommendations(
  highRiskItems: RiskItem[],
  mediumRiskItems: RiskItem[],
): CategoryRecommendations {
  return {
    highRiskItems,
    mediumRiskItems,
    generalRecommendation:
      "総合リスクが高い項目に対しては、優先的に対策を実施することが重要です。発生確率、影響度、対策レベルを総合的に考慮し、リスク低減のための包括的なアプローチを検討してください。",
  }
}

// 質問IDに基づいて推奨事項を生成する関数
function generateRecommendationByQuestionId(questionId: string, riskScore: number): string {
  // 質問IDに基づいて推奨事項を生成
  const recommendations: Record<string, Record<string, string>> = {
    "2001": {
      // 建物の築年数
      high: "建物の老朽化に対する詳細な構造診断を実施し、必要に応じて補強工事を計画してください。",
      medium: "定期的な建物診断を実施し、老朽化の兆候を早期に発見する体制を整えてください。",
    },
    "2004": {
      // 耐震性能
      high: "最新の耐震基準に基づいた耐震補強工事を早急に実施してください。",
      medium: "耐震性能の詳細評価を実施し、必要に応じて部分的な補強を検討してください。",
    },
    "2007": {
      // 浸水リスク
      high: "防水壁の設置、重要機器の高所配置、水検知システムの導入など、複合的な浸水対策を実施してください。",
      medium: "排水システムの強化、定期的な排水路の点検・清掃、浸水警報システムの導入を検討してください。",
    },
    "3001": {
      // 電源冗長性
      high: "電源システムの冗長性を N+1 以上に強化し、定期的な切り替えテストを実施してください。",
      medium: "現在の電源システムの負荷テストを実施し、必要に応じて容量増強や部分的な冗長化を検討してください。",
    },
    "3002": {
      // 冷却システム冗長性
      high: "冷却システムの冗長性を N+1 以上に強化し、定期的な切り替えテストを実施してください。",
      medium: "冷却システムの効率評価を実施し、必要に応じて部分的な冗長化や効率改善を検討してください。",
    },
    "3004": {
      // 消火設備
      high: "ガス系消火設備の導入、早期火災検知システムの強化、消火訓練の定期実施など、総合的な消火対策を実施してください。",
      medium: "現在の消火設備の点検頻度を増やし、消火訓練の定期実施を検討してください。",
    },
    "3005": {
      // 監視システム
      high: "24時間有人監視体制の確立、高度な自動監視システムの導入、アラート体制の強化を実施してください。",
      medium: "監視システムの自動化レベルを向上させ、重要なアラートに対する対応手順を明確化してください。",
    },
    "3007": {
      // バックアップ電源
      high: "UPSの容量増強、発電機の燃料備蓄量増加、定期的な負荷テストの実施など、バックアップ電源の信頼性向上策を実施してください。",
      medium: "バックアップ電源の定期点検頻度を増やし、燃料供給契約の見直しを検討してください。",
    },
    "3008": {
      // 物理セキュリティ
      high: "多要素認証の導入、監視カメラの増設、セキュリティ要員の増強、侵入検知システムの高度化など、総合的なセキュリティ強化を実施してください。",
      medium: "現在のアクセス管理システムの見直し、セキュリティ訓練の定期実施を検討してください。",
    },
    "5001": {
      // データバックアップ
      high: "地理的に分散した複数拠点でのバックアップ、暗号化の強化、自動化されたバックアップ検証の導入を実施してください。",
      medium: "バックアップの頻度と保持期間の見直し、定期的なリストアテストの実施を検討してください。",
    },
    "5003": {
      // 障害復旧計画
      high: "詳細な障害復旧計画（DRP）の策定、定期的な復旧訓練の実施、復旧目標時間（RTO）と復旧ポイント目標（RPO）の明確化を実施してください。",
      medium: "現在の障害復旧計画の見直し、主要システムに対する復旧テストの実施を検討してください。",
    },
    "5005": {
      // SLA遵守率
      high: "システム監視の強化、予防的メンテナンスの増強、障害対応プロセスの最適化、冗長性の向上などを実施し、SLA遵守率の向上を図ってください。",
      medium: "SLA違反の原因分析を実施し、頻発する問題に対する対策を強化してください。",
    },
  }

  const questionRecommendations = recommendations[questionId]
  if (!questionRecommendations) {
    return "リスクスコアに基づいた対策の見直しを検討してください。"
  }

  return riskScore >= 2.0 ? questionRecommendations.high : questionRecommendations.medium
}

// リスクスコアを計算すべきでない質問IDのリスト
const nonRiskQuestionIds = [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010]

// 回答が有効かどうかを判断する関数
function isValidAnswer(answer: any): boolean {
  const questionId = answer.question_id

  // リスクスコアを計算すべきでない質問IDの場合は無効とする
  if (nonRiskQuestionIds.includes(questionId)) {
    return false
  }

  // 値が存在するか確認
  if (answer.value && answer.value !== "未回答") {
    return true
  }

  // 数値が存在するか確認
  if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
    return true
  }

  // 選択肢が存在するか確認
  if (answer.selected_options && answer.selected_options !== null && typeof answer.selected_options === "object") {
    try {
      // JSONBの場合は配列に変換して長さをチェック
      const optionsArray = Array.isArray(answer.selected_options)
        ? answer.selected_options
        : JSON.parse(JSON.stringify(answer.selected_options))

      if (Array.isArray(optionsArray) && optionsArray.length > 0) {
        return true
      }
    } catch (error) {
      console.log("選択肢の変換エラー:", error)
    }
  }

  // 選択肢IDが存在するか確認
  if (
    answer.selected_option_ids &&
    Array.isArray(answer.selected_option_ids) &&
    answer.selected_option_ids.length > 0
  ) {
    return true
  }

  // いずれも存在しない場合は無効
  return false
}

// リスクスコアを正規化する関数（1〜5の範囲に収める）
function normalizeRiskScore(score: number): number {
  // スコアが1未満の場合は1に
  if (score < 1) return 1
  // スコアが5を超える場合は5に
  if (score > 5) return 5
  // それ以外はそのまま
  return score
}

// リスク推奨事項を生成する関数
export async function generateRiskRecommendations(facilityId: string): Promise<RiskRecommendations | null> {
  try {
    // 回答データを取得
    const answers = await getAnswers(facilityId)
    if (!answers || answers.length === 0) {
      console.log("回答データがありません")
      return null
    }

    // 質問データを取得
    const questions = await getQuestions()
    if (questions.length === 0) {
      console.log("質問データがありません")
      return null
    }

    // リスクスコアを取得
    const riskScore = await getRiskScore(facilityId)
    if (!riskScore) {
      console.log("リスクスコアがありません")
      return null
    }

    // 質問IDと質問テキストのマッピングを作成
    const questionMap = questions.reduce(
      (map, question) => {
        map[question.id] = question
        return map
      },
      {} as Record<number, Question>,
    )

    // 高リスク項目と中リスク項目を分類
    const highRiskItems: RiskItem[] = []
    const mediumRiskItems: RiskItem[] = []

    // 発生確率に関連する質問ID
    const probabilityQuestionIds = [2001, 2004, 2007, 3001, 3004, 3007]
    // 影響度に関連する質問ID
    const impactQuestionIds = [3002, 3005, 3008, 5001, 5003, 5005]
    // 対策レベルに関連する質問ID（その他の質問）
    const mitigationQuestionIds = questions
      .filter(
        (q) =>
          !probabilityQuestionIds.includes(q.id) &&
          !impactQuestionIds.includes(q.id) &&
          !nonRiskQuestionIds.includes(q.id),
      )
      .map((q) => q.id)

    // デバッグ情報：リスクスコアの概要を出力
    console.log("リスクスコア概要:", JSON.stringify(riskScore, null, 2))

    // デバッグ情報：全回答を出力
    console.log(
      "全回答:",
      JSON.stringify(
        answers.map((a) => ({
          question_id: a.question_id,
          value: a.value,
          numeric_value: a.numeric_value,
          selected_options: a.selected_options,
          selected_option_ids: a.selected_option_ids,
        })),
        null,
        2,
      ),
    )

    // オプションデータを取得
    const questionOptions = await getQuestionOptions()
    if (questionOptions.length === 0) {
      console.log("オプションデータがありません")
      return null
    }

    // オプションIDとオプションデータのマッピングを作成
    const optionsMap = questionOptions.reduce(
      (map, option) => {
        if (!map[option.question_id]) {
          map[option.question_id] = {}
        }
        map[option.question_id][option.option_id] = option
        return map
      },
      {} as Record<number, Record<number, any>>,
    )

    // デバッグ情報：オプションマップの構造を出力
    console.log("オプションマップ構造:", JSON.stringify(Object.keys(optionsMap), null, 2))

    // 各回答のリスクスコアを評価
    for (const answer of answers) {
      const questionId = answer.question_id
      const question = questionMap[questionId]

      if (!question) {
        console.log(`質問が見つかりません: questionId=${questionId}`)
        continue
      }

      // リスクスコアを計算すべきでない質問IDの場合はスキップ
      if (nonRiskQuestionIds.includes(questionId)) {
        console.log(`リスクスコア計算対象外の質問: questionId=${questionId}`)
        continue
      }

      // 回答が有効かどうかを確認
      if (!isValidAnswer(answer)) {
        console.log(`無効な回答: questionId=${questionId}`)
        continue
      }

      // 回答値を取得
      let answerValue: string | string[] = "未回答"
      if (answer.value) {
        answerValue = answer.value
      } else if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
        answerValue = answer.numeric_value.toString()
      } else if (answer.selected_options && typeof answer.selected_options === "object") {
        // JSONBの配列を通常の配列に変換
        try {
          const optionsArray = Array.isArray(answer.selected_options)
            ? answer.selected_options
            : JSON.parse(JSON.stringify(answer.selected_options))

          if (Array.isArray(optionsArray)) {
            answerValue = optionsArray
          }
        } catch (error) {
          console.log(`選択肢の変換エラー: questionId=${questionId}`, error)
        }
      }

      // リスクスコアを計算
      let itemRiskScore = 0

      // 選択肢IDからリスクスコアを取得
      if (
        answer.selected_option_ids &&
        Array.isArray(answer.selected_option_ids) &&
        answer.selected_option_ids.length > 0
      ) {
        const optionId = answer.selected_option_ids[0]

        if (optionsMap[questionId] && optionsMap[questionId][optionId]) {
          const option = optionsMap[questionId][optionId]
          const optionRiskScore = option.risk_score

          if (optionRiskScore !== null && optionRiskScore !== undefined) {
            // 文字列の場合は数値に変換
            if (typeof optionRiskScore === "string") {
              itemRiskScore = Number.parseFloat(optionRiskScore)
              if (isNaN(itemRiskScore)) {
                console.log(
                  `リスクスコアが数値に変換できません: questionId=${questionId}, optionId=${optionId}, riskScore=${optionRiskScore}`,
                )
                continue
              }
            } else {
              itemRiskScore = optionRiskScore
            }

            console.log(
              `リスクスコア取得成功: questionId=${questionId}, optionId=${optionId}, riskScore=${itemRiskScore}`,
            )
          } else {
            console.log(
              `オプションのリスクスコアがnullまたはundefinedです: questionId=${questionId}, optionId=${optionId}`,
            )
            continue
          }
        } else {
          console.log(`マッチするオプションが見つかりません: questionId=${questionId}, optionId=${optionId}`)
          continue
        }
      } else if (answer.selected_options && typeof answer.selected_options === "object") {
        // 一時的な対応として、テキストベースのマッチングを試みる
        try {
          const optionsArray = Array.isArray(answer.selected_options)
            ? answer.selected_options
            : JSON.parse(JSON.stringify(answer.selected_options))

          if (Array.isArray(optionsArray) && optionsArray.length > 0) {
            const selectedOptionText = optionsArray[0]

            // 該当する質問のオプションを検索
            const matchingOption = questionOptions.find(
              (option) => option.question_id === questionId && option.option_value === selectedOptionText,
            )

            if (matchingOption) {
              const optionRiskScore = matchingOption.risk_score

              if (optionRiskScore !== null && optionRiskScore !== undefined) {
                // 文字列の場合は数値に変換
                if (typeof optionRiskScore === "string") {
                  itemRiskScore = Number.parseFloat(optionRiskScore)
                  if (isNaN(itemRiskScore)) {
                    console.log(
                      `リスクスコアが数値に変換できません: questionId=${questionId}, optionText=${selectedOptionText}, riskScore=${optionRiskScore}`,
                    )
                    continue
                  }
                } else {
                  itemRiskScore = optionRiskScore
                }

                console.log(
                  `テキストマッチングでリスクスコア取得成功: questionId=${questionId}, optionText=${selectedOptionText}, riskScore=${itemRiskScore}`,
                )
              } else {
                console.log(
                  `オプションのリスクスコアがnullまたはundefinedです: questionId=${questionId}, optionText=${selectedOptionText}`,
                )
                continue
              }
            } else {
              console.log(
                `テキストマッチングでオプションが見つかりません: questionId=${questionId}, selectedOption=${selectedOptionText}`,
              )

              // 一時的な対応として、デフォルト値を使用
              itemRiskScore = 3
              console.log(`デフォルトのリスクスコアを使用: questionId=${questionId}, riskScore=${itemRiskScore}`)
            }
          }
        } catch (error) {
          console.log(`選択肢の処理エラー: questionId=${questionId}`, error)
          continue
        }
      } else {
        // 選択肢がない場合はスキップ
        console.log(`選択肢がありません: questionId=${questionId}`)
        continue
      }

      // リスクスコアを1〜5の範囲に正規化
      itemRiskScore = normalizeRiskScore(itemRiskScore)

      // デバッグ情報：リスクスコアの変換を出力
      console.log(`リスクスコア変換: questionId=${questionId}, calculatedRiskScore=${itemRiskScore}`)

      // リスク項目を作成
      const riskItem: RiskItem = {
        questionId: questionId.toString(),
        question: question.text,
        answer: answerValue,
        riskScore: itemRiskScore,
        recommendation: generateRecommendationByQuestionId(questionId.toString(), itemRiskScore),
      }

      // リスクスコアに基づいて高リスク項目と中リスク項目に分類
      if (itemRiskScore >= 4) {
        highRiskItems.push(riskItem)
      } else if (itemRiskScore >= 2) {
        mediumRiskItems.push(riskItem)
      }
    }

    // デバッグ情報：高リスク項目と中リスク項目を出力
    console.log("高リスク項目:", JSON.stringify(highRiskItems, null, 2))
    console.log("中リスク項目:", JSON.stringify(mediumRiskItems, null, 2))

    // カテゴリー別の高リスク項目と中リスク項目を抽出
    const probabilityHighRiskItems = highRiskItems.filter((item) =>
      probabilityQuestionIds.includes(Number(item.questionId)),
    )
    const probabilityMediumRiskItems = mediumRiskItems.filter((item) =>
      probabilityQuestionIds.includes(Number(item.questionId)),
    )

    const impactHighRiskItems = highRiskItems.filter((item) => impactQuestionIds.includes(Number(item.questionId)))
    const impactMediumRiskItems = mediumRiskItems.filter((item) => impactQuestionIds.includes(Number(item.questionId)))

    const mitigationHighRiskItems = highRiskItems.filter((item) =>
      mitigationQuestionIds.includes(Number(item.questionId)),
    )
    const mitigationMediumRiskItems = mediumRiskItems.filter((item) =>
      mitigationQuestionIds.includes(Number(item.questionId)),
    )

    // 総合リスクの高リスク項目と中リスク項目（全カテゴリーから上位のものを選択）
    const totalHighRiskItems = [...highRiskItems].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
    const totalMediumRiskItems = [...mediumRiskItems].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)

    // カテゴリー別の推奨事項を生成
    const probabilityRecommendations = generateProbabilityRecommendations(
      probabilityHighRiskItems,
      probabilityMediumRiskItems,
    )

    const impactRecommendations = generateImpactRecommendations(impactHighRiskItems, impactMediumRiskItems)

    const mitigationRecommendations = generateMitigationRecommendations(
      mitigationHighRiskItems,
      mitigationMediumRiskItems,
    )

    const totalRiskRecommendations = generateTotalRiskRecommendations(totalHighRiskItems, totalMediumRiskItems)

    // 全カテゴリーの推奨事項を返す
    return {
      probabilityRecommendations,
      impactRecommendations,
      mitigationRecommendations,
      totalRiskRecommendations,
    }
  } catch (error) {
    console.error("リスク推奨事項の生成に失敗しました:", error)
    return null
  }
}

