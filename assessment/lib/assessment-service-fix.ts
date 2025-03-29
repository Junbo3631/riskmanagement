import { getAssessmentById } from "@/lib/assessment-service"
import { getQuestionsBySection } from "@/lib/question-service"
import { supabase } from "@/lib/supabaseClient"

// リスクスコアを計算して保存（修正版）
export async function calculateAndSaveRiskScore(facilityId: string): Promise<void> {
  try {
    // 評価データを取得
    const assessment = await getAssessmentById(facilityId)
    if (!assessment || !assessment.answers) {
      throw new Error("評価データが見つかりません")
    }

    // セクションごとの重み付け
    const sectionWeights = {
      "1": 0.1, // 基本情報: 10%
      "2": 0.25, // 物理的セキュリティ: 25%
      "3": 0.3, // 環境リスク: 30%
      "4": 0.2, // 運用管理: 20%
      "5": 0.15, // 事業継続性: 15%
    }

    // セクションごとのスコアを計算
    const sectionScores: Record<string, number> = {}
    let totalWeightedScore = 0

    // 各セクションのスコアを計算
    for (const [sectionId, questions] of Object.entries(assessment.answers)) {
      // セクションの質問リストを取得
      const sectionQuestions = await getQuestionsBySection(Number(sectionId))
      if (!sectionQuestions || sectionQuestions.length === 0) {
        console.warn(`No questions found for section ${sectionId}`)
        continue
      }

      let sectionScore = 0
      let answeredQuestions = 0

      // 各質問のスコアを計算
      for (const question of sectionQuestions) {
        const answer = questions[question.id]
        if (answer === undefined) continue

        let questionScore = 0
        answeredQuestions++

        // 質問タイプに応じたスコア計算
        switch (question.type) {
          case "select":
            // 選択肢の場合、選択された値に基づいてスコア計算
            if (Array.isArray(answer)) {
              // 複数選択の場合
              const selectedOptions = answer
              const totalOptions = question.options?.length || 1
              const selectedCount = selectedOptions.length

              // リスク選択肢の数に基づいてスコア計算
              const riskOptions = question.options?.filter((opt) => opt.risk_level === "high") || []
              const selectedRiskCount = selectedOptions.filter((opt) =>
                riskOptions.some((riskOpt) => riskOpt.value === opt),
              ).length

              // リスク選択肢が選ばれた割合でスコア計算（高いほどリスク高）
              questionScore = selectedRiskCount > 0 ? (selectedRiskCount / selectedCount) * 100 : 0
            } else {
              // 単一選択の場合
              const selectedOption = question.options?.find((opt) => opt.value === answer)
              if (selectedOption) {
                switch (selectedOption.risk_level) {
                  case "low":
                    questionScore = 25
                    break
                  case "medium":
                    questionScore = 50
                    break
                  case "high":
                    questionScore = 100
                    break
                  default:
                    questionScore = 0
                }
              }
            }
            break

          case "number":
            // 数値の場合、閾値に基づいてスコア計算
            const numValue = typeof answer === "number" ? answer : Number.parseFloat(answer)
            if (!isNaN(numValue)) {
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
                      questionScore = 25
                      break
                    case "medium":
                      questionScore = 50
                      break
                    case "high":
                      questionScore = 100
                      break
                    default:
                      questionScore = 0
                  }
                  break
                }
              }
            }
            break

          case "text":
          case "date":
            // テキストや日付の場合はリスクスコアに影響しない
            questionScore = 0
            break

          default:
            questionScore = 0
        }

        // 質問の重要度に基づいて重み付け
        const importance = question.importance || "medium"
        let importanceMultiplier = 1
        switch (importance) {
          case "low":
            importanceMultiplier = 0.5
            break
          case "medium":
            importanceMultiplier = 1
            break
          case "high":
            importanceMultiplier = 2
            break
        }

        sectionScore += questionScore * importanceMultiplier
      }

      // セクションの平均スコアを計算
      const avgSectionScore = answeredQuestions > 0 ? sectionScore / answeredQuestions : 0
      sectionScores[sectionId] = avgSectionScore

      // 重み付けされたスコアを合計
      const weight = sectionWeights[sectionId as keyof typeof sectionWeights] || 0
      totalWeightedScore += avgSectionScore * weight

      // デバッグログ
      console.log(
        `セクション ${sectionId}: スコア=${avgSectionScore}, 重み=${weight}, 加重スコア=${avgSectionScore * weight}`,
      )
    }

    // 総合スコアのデバッグログ
    console.log(`総合スコア: ${totalWeightedScore}`)

    // リスクレベルを決定
    let riskLevel = "低"
    if (totalWeightedScore >= 75) {
      riskLevel = "高"
    } else if (totalWeightedScore >= 50) {
      riskLevel = "中"
    }

    // リスクスコアを保存
    const { error } = await supabase
      .from("facilities")
      .update({
        riskScore: {
          totalScore: Math.round(totalWeightedScore),
          sectionScores,
          riskLevel,
          calculatedAt: new Date().toISOString(),
        },
      })
      .eq("id", facilityId)

    if (error) {
      console.error("Error saving risk score:", error)
      throw error
    }

    // 成功ログ
    console.log(`リスクスコア計算完了: スコア=${Math.round(totalWeightedScore)}, レベル=${riskLevel}`)
  } catch (error) {
    console.error("Error calculating risk score:", error)
    throw error
  }
}

