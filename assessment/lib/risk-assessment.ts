// リスクレベルの定義
export enum RiskLevel {
  Low = "低",
  Medium = "中",
  High = "高",
}

// リスクレベルに応じたバッジのバリアントを返す関数
export function getRiskLevelBadgeVariant(riskLevel: RiskLevel): "default" | "secondary" | "destructive" {
  switch (riskLevel) {
    case RiskLevel.Low:
      return "default"
    case RiskLevel.Medium:
      return "secondary"
    case RiskLevel.High:
      return "destructive"
    default:
      return "default"
  }
}

// 評価アセスメントのリスクスコアを計算する関数
export function calculateAssessmentRiskScore(assessment: any): {
  probabilityScore: number
  impactScore: number
  mitigationScore: number
  totalScore: number
  riskLevel: RiskLevel
} {
  console.log("===== リスクスコア計算開始 =====")
  console.log("評価ID:", assessment?.id)
  console.log("評価名:", assessment?.name)

  // 確率、影響、軽減のスコアを初期化
  let probabilityScore = 0
  let impactScore = 0
  let mitigationScore = 0

  // スコアの数を初期化
  let probabilityCount = 0
  let impactCount = 0
  let mitigationCount = 0

  // 各リスク要素タイプごとの詳細を保存する配列
  const probabilityDetails: any[] = []
  const impactDetails: any[] = []
  const mitigationDetails: any[] = []

  console.log("回答データの有無:", !!assessment?.answers)
  console.log("回答データのセクション数:", assessment?.answers ? Object.keys(assessment.answers).length : 0)

  if (assessment?.answers) {
    // 各セクションの回答を反復処理
    for (const sectionId in assessment.answers) {
      const sectionAnswers = assessment.answers[sectionId]
      console.log(`セクション ${sectionId} の回答数:`, Object.keys(sectionAnswers).length)

      // 各回答を反復処理
      for (const questionId in sectionAnswers) {
        const answer = sectionAnswers[questionId]

        // 回答が空でないことを確認
        if (answer) {
          // リスク要素のマッピングを取得
          const riskFactor = riskFactorMapping[questionId]

          if (riskFactor) {
            // 回答をスコアに変換
            const score = answerToScoreMapping[answer] || 1 // デフォルト値は1
            const weightedScore = score * riskFactor.weight // 重み付けスコア

            console.log(
              `質問 ${questionId}: 回答=${answer}, スコア=${score}, 重み=${riskFactor.weight}, 重み付けスコア=${weightedScore}, タイプ=${riskFactor.type}`,
            )

            const detail = {
              questionId,
              answer,
              score,
              weight: riskFactor.weight,
              weightedScore,
            }

            switch (riskFactor.type) {
              case "probability":
                probabilityScore += weightedScore
                probabilityCount += riskFactor.weight
                probabilityDetails.push(detail)
                break
              case "impact":
                impactScore += weightedScore
                impactCount += riskFactor.weight
                impactDetails.push(detail)
                break
              case "mitigation":
                mitigationScore += weightedScore
                mitigationCount += riskFactor.weight
                mitigationDetails.push(detail)
                break
            }
          } else {
            console.log(`質問 ${questionId} にリスク要素マッピングがありません`)
          }
        } else {
          console.log(`質問 ${questionId} の回答が空です`)
        }
      }
    }
  }

  // 平均スコアを計算
  const rawProbabilityScore = probabilityCount > 0 ? probabilityScore / probabilityCount : 1
  const rawImpactScore = impactCount > 0 ? impactScore / impactCount : 1
  const rawMitigationScore = mitigationCount > 0 ? mitigationScore / mitigationCount : 1

  // 最終スコアを計算（小数点以下2桁まで）
  probabilityScore = Math.round(rawProbabilityScore * 100) / 100
  impactScore = Math.round(rawImpactScore * 100) / 100
  mitigationScore = Math.round(rawMitigationScore * 100) / 100

  // 総合リスクスコアを計算
  const rawTotalScore = (probabilityScore * impactScore) / mitigationScore
  const totalScore = Math.round(rawTotalScore * 100) / 100

  // リスクレベルを決定
  let riskLevel: RiskLevel = RiskLevel.Medium // デフォルト値
  if (totalScore >= 4) {
    riskLevel = RiskLevel.High
  } else if (totalScore >= 2) {
    riskLevel = RiskLevel.Medium
  } else {
    riskLevel = RiskLevel.Low
  }

  // 詳細なログ出力
  console.log("\n===== #発生確率スコア =====")
  console.log(`合計: ${probabilityScore} (${probabilityDetails.length}項目, 重み合計: ${probabilityCount})`)
  console.log("詳細:", probabilityDetails)

  console.log("\n===== #影響度スコア =====")
  console.log(`合計: ${impactScore} (${impactDetails.length}項目, 重み合計: ${impactCount})`)
  console.log("詳細:", impactDetails)

  console.log("\n===== #対策レベルスコア =====")
  console.log(`合計: ${mitigationScore} (${mitigationDetails.length}項目, 重み合計: ${mitigationCount})`)
  console.log("詳細:", mitigationDetails)

  console.log("\n===== #総合リスクスコア =====")
  console.log(`計算式: (${probabilityScore} * ${impactScore}) / ${mitigationScore} = ${totalScore}`)
  console.log(`リスクレベル: ${riskLevel}`)

  console.log("===== リスクスコア計算終了 =====\n")

  return {
    probabilityScore,
    impactScore,
    mitigationScore,
    totalScore,
    riskLevel,
  }
}

// セクションごとのリスクスコアを計算する関数
export function calculateSectionRiskScores(assessment: any): Record<string, any> {
  const sectionScores: Record<string, any> = {}

  if (assessment?.answers) {
    for (const sectionId in assessment.answers) {
      const sectionAnswers = assessment.answers[sectionId]

      // 確率、影響、軽減のスコアを初期化
      let probabilityScore = 0
      let impactScore = 0
      let mitigationScore = 0

      // スコアの数を初期化
      let probabilityCount = 0
      let impactCount = 0
      let mitigationCount = 0

      // 各回答を反復処理
      for (const questionId in sectionAnswers) {
        const answer = sectionAnswers[questionId]

        // 回答が空でないことを確認
        if (answer) {
          // リスク要素のマッピングを取得
          const riskFactor = riskFactorMapping[questionId]

          if (riskFactor) {
            // 回答をスコアに変換
            const score = answerToScoreMapping[answer] || 1 // デフォルト値は1

            switch (riskFactor.type) {
              case "probability":
                probabilityScore += score
                probabilityCount++
                break
              case "impact":
                impactScore += score
                impactCount++
                break
              case "mitigation":
                mitigationScore += score
                mitigationCount++
                break
            }
          }
        }
      }

      // 平均スコアを計算
      probabilityScore = probabilityCount > 0 ? probabilityScore / probabilityCount : 1
      impactScore = impactCount > 0 ? impactScore / impactCount : 1
      mitigationScore = mitigationCount > 0 ? mitigationScore / mitigationCount : 1

      // セクションスコアを計算
      const sectionScore = (probabilityScore * impactScore) / mitigationScore

      // リスクレベルを決定
      let riskLevel: RiskLevel = RiskLevel.Medium // デフォルト値
      if (sectionScore >= 4) {
        riskLevel = RiskLevel.High
      } else if (sectionScore >= 2) {
        riskLevel = RiskLevel.Medium
      } else {
        riskLevel = RiskLevel.Low
      }

      sectionScores[sectionId] = {
        sectionScore,
        probabilityScore,
        impactScore,
        mitigationScore,
        riskLevel,
      }
    }
  }

  return sectionScores
}

// リスク要素の種類を定義
export enum RiskFactorType {
  Probability = "probability", // 発生確率
  Impact = "impact", // 影響度
  Mitigation = "mitigation", // 対策
}

// リスク要素のマッピング（質問IDとリスク要素の種類の対応）
export const riskFactorMapping: Record<string, { type: RiskFactorType; weight: number }> = {
  // 建設および立地に関するリスク要素 - 2.2.1 一般
  "general-building-age": { type: RiskFactorType.Probability, weight: 1.2 },
  "general-impact-range": { type: RiskFactorType.Impact, weight: 1.2 },
  "general-inspection-system": { type: RiskFactorType.Mitigation, weight: 1.2 },

  // 建設および立地に関するリスク要素 - 2.2.2 壁
  "wall-material": { type: RiskFactorType.Probability, weight: 1.3 },
  "wall-fire-resistance": { type: RiskFactorType.Impact, weight: 1.3 },
  "wall-fire-protection": { type: RiskFactorType.Mitigation, weight: 1.3 },

  // 建設および立地に関するリスク要素 - 2.2.3 ドアと窓
  "door-window-seal": { type: RiskFactorType.Probability, weight: 1.2 },
  "door-window-impact": { type: RiskFactorType.Impact, weight: 1.2 },
  "door-window-protection": { type: RiskFactorType.Mitigation, weight: 1.2 },

  // 建設および立地に関するリスク要素 - 2.2.4 貫通部
  "penetration-sealing": { type: RiskFactorType.Probability, weight: 1.4 },
  "penetration-impact": { type: RiskFactorType.Impact, weight: 1.4 },
  "penetration-protection": { type: RiskFactorType.Mitigation, weight: 1.4 },

  // 建設および立地に関するリスク要素 - 2.2.5～2.2.12 建物その他要素
  "other-location-risk": { type: RiskFactorType.Probability, weight: 1.1 },
  "other-structural-damage-impact": { type: RiskFactorType.Impact, weight: 1.1 },
  "other-building-design-level": { type: RiskFactorType.Mitigation, weight: 1.1 },

  // 保護システムに関するリスク要素 - 2.3.x 火災検知・消火
  "fire-detection-reliability": { type: RiskFactorType.Probability, weight: 2.0 },
  "fire-damage-range": { type: RiskFactorType.Impact, weight: 2.0 },
  "fire-suppression-system": { type: RiskFactorType.Mitigation, weight: 2.0 },

  // 保護システムに関するリスク要素 - 2.4.x 監視・セキュリティ
  "security-monitoring": { type: RiskFactorType.Probability, weight: 1.5 },
  "security-breach-impact": { type: RiskFactorType.Impact, weight: 1.5 },
  "security-defense-layers": { type: RiskFactorType.Mitigation, weight: 1.5 },

  // ユーティリティに関するリスク要素 - 2.5.x 電源系統
  "power-failure-frequency": { type: RiskFactorType.Probability, weight: 2.0 },
  "power-failure-impact-time": { type: RiskFactorType.Impact, weight: 2.0 },
  "power-backup-configuration": { type: RiskFactorType.Mitigation, weight: 2.0 },

  // ユーティリティに関するリスク要素 - 2.6.x 空調系統
  "cooling-failure-frequency": { type: RiskFactorType.Probability, weight: 1.5 },
  "cooling-failure-temperature-rise": { type: RiskFactorType.Impact, weight: 1.5 },
  "cooling-system-redundancy": { type: RiskFactorType.Mitigation, weight: 1.5 },

  // ユーティリティに関するリスク要素 - 2.7.x その他設備
  "other-equipment-failure-frequency": { type: RiskFactorType.Probability, weight: 1.2 },
  "other-equipment-impact": { type: RiskFactorType.Impact, weight: 1.2 },
  "auxiliary-equipment-backup": { type: RiskFactorType.Mitigation, weight: 1.2 },

  // 既存の保護システムに関するリスク要素
  "power-supply": { type: RiskFactorType.Mitigation, weight: 1.2 },
  "cooling-system": { type: RiskFactorType.Mitigation, weight: 1 },
  "fire-suppression": { type: RiskFactorType.Mitigation, weight: 1 },
  "backup-generator": { type: RiskFactorType.Mitigation, weight: 1.5 },

  // 既存のユーティリティに関するリスク要素
  "flood-risk": { type: RiskFactorType.Probability, weight: 1.5 },
  "earthquake-risk": { type: RiskFactorType.Probability, weight: 1.5 },
  "severe-weather-risk": { type: RiskFactorType.Probability, weight: 1.2 },

  // ハザード対策に関するリスク要素
  "incident-response-plan": { type: RiskFactorType.Mitigation, weight: 1.2 },

  // 3.1.x 自然災害 (重み：2.0)
  "natural-disaster-frequency": { type: RiskFactorType.Probability, weight: 2.0 },
  "max-disaster-impact": { type: RiskFactorType.Impact, weight: 2.0 },
  "disaster-countermeasures": { type: RiskFactorType.Mitigation, weight: 2.0 },

  // 3.2.x 洪水リスク (重み：1.8)
  "flood-risk-location": { type: RiskFactorType.Probability, weight: 1.8 },
  "flood-impact": { type: RiskFactorType.Impact, weight: 1.8 },
  "flood-countermeasures": { type: RiskFactorType.Mitigation, weight: 1.8 },

  // 3.3.x 地震リスク (重み：1.8)
  "earthquake-risk-location": { type: RiskFactorType.Probability, weight: 1.8 },
  "max-earthquake-impact": { type: RiskFactorType.Impact, weight: 1.8 },
  "earthquake-countermeasures": { type: RiskFactorType.Mitigation, weight: 1.8 },

  // 3.4.x 風害・雷害リスク (重み：1.5)
  "wind-lightning-risk": { type: RiskFactorType.Probability, weight: 1.5 },
  "wind-lightning-impact": { type: RiskFactorType.Impact, weight: 1.5 },
  "wind-lightning-countermeasures": { type: RiskFactorType.Mitigation, weight: 1.5 },

  // 3.5.x 事業継続計画 (重み：1.7)
  "business-continuity-risk-frequency": { type: RiskFactorType.Probability, weight: 1.7 },
  "business-impact": { type: RiskFactorType.Impact, weight: 1.7 },
  "bcp-status": { type: RiskFactorType.Mitigation, weight: 1.7 },

  // 数値IDの質問にも対応
  "2001": { type: RiskFactorType.Probability, weight: 1.5 },
  "2002": { type: RiskFactorType.Mitigation, weight: 1.2 },
  "2003": { type: RiskFactorType.Mitigation, weight: 1.0 },
  "2004": { type: RiskFactorType.Probability, weight: 1.3 },
  "2005": { type: RiskFactorType.Mitigation, weight: 1.5 },
  "2006": { type: RiskFactorType.Mitigation, weight: 1.2 },
  "2007": { type: RiskFactorType.Probability, weight: 1.0 },
  "2008": { type: RiskFactorType.Mitigation, weight: 1.4 },
  "2009": { type: RiskFactorType.Mitigation, weight: 1.3 },
  "2010": { type: RiskFactorType.Mitigation, weight: 1.1 },

  // セクション3: 環境リスク
  "3001": { type: RiskFactorType.Probability, weight: 1.8 },
  "3002": { type: RiskFactorType.Impact, weight: 1.5 },
  "3003": { type: RiskFactorType.Mitigation, weight: 1.3 },
  "3004": { type: RiskFactorType.Probability, weight: 1.6 },
  "3005": { type: RiskFactorType.Impact, weight: 1.7 },
  "3006": { type: RiskFactorType.Mitigation, weight: 1.4 },
  "3007": { type: RiskFactorType.Probability, weight: 1.2 },
  "3008": { type: RiskFactorType.Impact, weight: 1.5 },

  // セクション4: 運用管理
  "4001": { type: RiskFactorType.Mitigation, weight: 1.4 },
  "4002": { type: RiskFactorType.Mitigation, weight: 1.2 },
  "4003": { type: RiskFactorType.Mitigation, weight: 1.3 },
  "4004": { type: RiskFactorType.Mitigation, weight: 1.1 },
  "4005": { type: RiskFactorType.Mitigation, weight: 1.5 },
  "4006": { type: RiskFactorType.Mitigation, weight: 1.2 },
  "4007": { type: RiskFactorType.Mitigation, weight: 1.0 },

  // セクション5: 事業継続性
  "5001": { type: RiskFactorType.Impact, weight: 1.8 },
  "5002": { type: RiskFactorType.Mitigation, weight: 1.6 },
  "5003": { type: RiskFactorType.Impact, weight: 1.7 },
  "5004": { type: RiskFactorType.Mitigation, weight: 1.5 },
  "5005": { type: RiskFactorType.Impact, weight: 1.6 },
  "5006": { type: RiskFactorType.Mitigation, weight: 1.4 },
  "5007": { type: RiskFactorType.Impact, weight: 1.5 },
  "5008": { type: RiskFactorType.Mitigation, weight: 1.3 },
}

// 回答値をスコアに変換するマッピング（1〜5のスケールに変換）
export const answerToScoreMapping: Record<string, number> = {
  // 2.2.1 一般 - 発生確率
  "less-than-5": 1,
  "5-to-10": 2,
  "10-to-15": 3,
  "15-to-20": 4,
  "more-than-20": 5,

  // 2.2.1 一般 - 影響度
  local: 1,
  "partial-floor": 2,
  "major-part": 3,
  "whole-building": 4,
  "wide-area": 5,

  // 2.2.1 一般 - 対策レベル
  "no-inspection": 1,
  "irregular-visual": 2,
  annual: 3,
  "semi-annual": 4,
  quarterly: 5,

  // 2.2.2 壁 - 発生確率
  "non-combustible-less-5": 1,
  "non-combustible-5-10": 2,
  "non-combustible-more-10": 3,
  "semi-non-combustible": 4,
  combustible: 5,

  // 2.2.2 壁 - 影響度
  "more-than-2h": 1,
  "1-2h": 2,
  "1h": 3,
  "30min-1h": 4,
  "less-than-30min": 5,

  // 2.2.2 壁 - 対策レベル
  "all-certified": 5,
  "main-certified": 4,
  "minimum-legal": 3,
  partial: 2,
  none: 1,

  // 2.2.3 ドアと窓 - 発生確率
  perfect: 1,
  good: 2,
  "partial-wear": 3,
  "obvious-deterioration": 4,
  "serious-deterioration": 5,

  // 2.2.3 ドアと窓 - 影響度
  "no-impact": 1,
  "ac-efficiency": 2,
  "local-water-leak": 3,
  "security-risk": 4,
  "direct-risk": 5,

  // 2.2.3 ドアと窓 - 対策レベル
  advanced: 5,
  "fire-water-electronic": 4,
  "standard-fire": 3,
  basic: 2,
  none: 1,

  // 2.2.4 貫通部 - 発生確率
  "perfect-certified": 1,
  "properly-sealed": 2,
  "partially-insufficient": 3,
  "multiple-issues": 4,
  "many-untreated": 5,

  // 2.2.4 貫通部 - 影響度
  "no-impact": 1,
  "adjacent-only": 2,
  "same-floor": 3,
  "multiple-floors": 4,
  "whole-building": 5,

  // 2.2.4 貫通部 - 対策レベル
  "certified-regular-inspection": 5,
  "certified-material": 4,
  "standard-seal": 3,
  partial: 2,
  none: 1,

  // 2.2.5～2.2.12 建物その他要素 - 発生確率
  "no-risk": 1,
  "minor-risk": 2,
  "moderate-risk": 3,
  "major-single-risk": 4,
  "multiple-major-risks": 5,

  // 2.2.5～2.2.12 建物その他要素 - 影響度
  "local-repair": 1,
  "partial-shutdown": 2,
  "temporary-full-shutdown": 3,
  "long-term-shutdown": 4,
  "permanent-loss": 5,

  // 2.2.5～2.2.12 建物その他要素 - 対策レベル
  "beyond-latest": 5,
  "latest-standards": 4,
  "construction-time-standards": 3,
  "minimum-legal": 2,
  "no-special-design": 1,

  // 2.3.x 火災検知・消火 - 発生確率
  "vewfd-no-false": 1,
  "standard-maintained": 2,
  "basic-inspected": 3,
  outdated: 4,
  insufficient: 5,

  // 2.3.x 火災検知・消火 - 影響度
  "device-only": 1,
  "single-rack": 2,
  "adjacent-racks": 3,
  "entire-room": 4,
  "multiple-areas": 5,

  // 2.3.x 火災検知・消火 - 対策レベル
  "gas-sprinkler": 5,
  "gas-only": 4,
  "sprinkler-only": 3,
  "manual-only": 2,
  "insufficient-none": 1,

  // 2.4.x 監視・セキュリティ - 発生確率
  "24h-biometric": 1,
  "24h-card": 2,
  "business-hours": 3,
  limited: 4,
  minimal: 5,

  // 2.4.x 監視・セキュリティ - 影響度
  "no-critical-access": 1,
  "non-critical-only": 2,
  "some-critical": 3,
  "major-systems": 4,
  "all-systems": 5,

  // 2.4.x 監視・セキュリティ - 対策レベル
  comprehensive: 5,
  standard: 4,
  basic: 3,
  limited: 2,
  minimal: 1,

  // 2.5.x 電源系統 - 発生確率
  "no-failure": 1,
  "one-minor": 2,
  "two-to-three": 3,
  monthly: 4,
  frequent: 5,

  // 2.5.x 電源系統 - 影響度
  "no-impact": 1,
  seconds: 2,
  minutes: 3,
  hours: 4,
  days: 5,

  // 2.5.x 電源系統 - 対策レベル
  "2n-plus-1": 5,
  "2n": 4,
  "n-plus-1": 3,
  "single-backup": 2,
  "no-backup": 1,

  // 2.6.x 空調系統 - 発生確率
  "no-failure": 1,
  "one-minor": 2,
  "two-to-three": 3,
  quarterly: 4,
  "monthly-plus": 5,

  // 2.6.x 空調系統 - 影響度
  "within-tolerance": 1,
  "mild-rise": 2,
  "moderate-rise": 3,
  "severe-rise": 4,
  "critical-rise": 5,

  // 2.6.x 空調系統 - 対策レベル
  "n-plus-2": 5,
  "n-plus-1": 4,
  "multiple-non-redundant": 3,
  "single-system": 2,
  "no-dedicated": 1,

  // 2.7.x その他設備 - 発生確率
  "no-history": 1,
  "once-in-five-years": 2,
  "once-or-twice-in-three-years": 3,
  "once-a-year": 4,
  "multiple-per-year": 5,

  // 2.7.x その他設備 - 影響度
  "no-impact": 1,
  "minor-adjustment": 2,
  "partial-function-stop": 3,
  "major-function-stop": 4,
  "complete-shutdown": 5,

  // 2.7.x その他設備 - 対策レベル
  "full-redundancy-spares": 5,
  "main-equipment-redundancy": 4,
  "limited-redundancy": 3,
  "spares-only": 2,
  "no-backup": 1,

  // 保護システム
  single: 4, // 単一電源は対策レベル低
  dual: 2, // 二重電源は対策レベル  2,
  "no-backup": 1,

  // 保護システム
  single: 4, // 単一電源は対策レベル低
  dual: 2, // 二重電源は対策レベル中
  ups: 1, // UPSは対策レベル高

  // 冷却システム
  "air-cooled": 3,
  "water-cooled": 2,
  "chilled-water": 1,

  // 消火設備
  fm200: 1,
  "inert-gas": 2,
  "water-sprinkler": 3,

  // バックアップ発電機
  diesel: 1,
  gas: 2,
  none: 5,

  // 洪水リスク、地震リスク、異常気象リスク
  high: 5, // 高リスク
  medium: 3, // 中リスク
  low: 1, // 低リスク

  // インシデント対応計画
  yes: 1, // 計画ありは対策レベル高
  no: 5, // 計画なしは対策レベル低

  // 3.1.x 自然災害 - 発生確率
  "none-in-100-years": 1,
  "once-in-50-years": 2,
  "once-or-twice-in-20-years": 3,
  "once-or-twice-in-10-years": 4,
  "three-plus-in-10-years": 5,

  // 3.1.x 自然災害 - 影響度
  "no-impact": 1,
  "temporary-function-degradation": 2,
  "critical-functions-only": 3,
  "complete-shutdown": 4,
  "severe-structural-damage": 5,

  // 3.1.x 自然災害 - 対策レベル
  "comprehensive-training-alternate": 5,
  "major-disaster-training": 4,
  "basic-measures-only": 3,
  "partial-limited": 2,
  "no-special-measures": 1,

  // 3.2.x 洪水リスク - 発生確率
  "outside-500-year": 1,
  "inside-500-year-elevated": 2,
  "outside-100-year": 3,
  "inside-100-year": 4,
  "flooded-within-10-years": 5,

  // 3.2.x 洪水リスク - 影響度
  "no-impact": 1,
  "site-access-only": 2,
  "non-critical-areas": 3,
  "power-cooling-impact": 4,
  "direct-impact-critical": 5,

  // 3.2.x 洪水リスク - 対策レベル
  "comprehensive-measures": 5,
  "major-measures": 4,
  "basic-measures": 3,
  "minimal-measures": 2,
  "no-special-measures": 1,

  // 3.3.x 地震リスク - 発生確率
  "very-low-seismic": 1,
  "low-seismic": 2,
  "moderate-seismic": 3,
  "active-seismic": 4,
  "very-active-fault-proximity": 5,

  // 3.3.x 地震リスク - 影響度
  "operational-continuity": 1,
  "minor-equipment-damage": 2,
  "partial-equipment-shutdown": 3,
  "major-system-shutdown": 4,
  "structural-damage-long-term": 5,

  // 3.3.x 地震リスク - 対策レベル
  "comprehensive-building-equipment-training-bcp": 5,
  "major-building-equipment": 4,
  "building-only": 3,
  "partial-measures": 2,
  "no-special-measures": 1,

  // 3.4.x 風害・雷害リスク - 発生確率
  "very-low-risk": 1,
  "somewhat-low-risk": 2,
  "moderate-risk": 3,
  "somewhat-high-risk": 4,
  "very-high-risk": 5,

  // 3.4.x 風害・雷害リスク - 影響度
  "no-impact": 1,
  "minor-external-impact": 2,
  "temporary-power-quality": 3,
  "partial-system-failure": 4,
  "major-system-shutdown": 5,

  // 3.4.x 風害・雷害リスク - 対策レベル
  "comprehensive-building-equipment-power": 5,
  "major-building-power": 4,
  "basic-protection": 3,
  "partial-measures": 2,
  "no-special-measures": 1,

  // 3.5.x 事業継続計画 - 発生確率
  "none-in-10-years": 1,
  "once-in-10-years": 2,
  "once-in-5-years": 3,
  "once-in-2-years": 4,
  "once-or-more-per-year": 5,

  // 3.5.x 事業継続計画 - 影響度
  "sla-achievable": 1,
  "minor-sla-miss": 2,
  "moderate-sla-miss": 3,
  "major-sla-miss": 4,
  "customer-loss-risk": 5,

  // 3.5.x 事業継続計画 - 対策レベル
  "comprehensive-bcp-training-alternate": 5,
  "standard-bcp-annual": 4,
  "basic-bcp-only": 3,
  "bcp-in-progress": 2,
  "no-bcp": 1,

  // 数値回答のマッピング
  "1": 5, // いいえ（高リスク）
  "2": 4, // 対応予定
  "3": 3, // 一部対応済み
  "4": 2, // ほぼ対応済み
  "5": 1, // はい（リスクなし）
}

// セクション名を日本語で返す関数
export function getSectionNameJa(sectionId: string): string {
  switch (sectionId) {
    case "basic-info":
      return "基本情報"
    case "building-structure":
      return "建物構造"
    case "facility-equipment":
      return "設備機器"
    case "disaster-risk":
      return "ユーティリティ"
    case "hazard-countermeasures":
      return "ハザード対策"
    case "1":
      return "基本情報"
    case "2":
      return "物理的セキュリティ"
    case "3":
      return "環境リスク"
    case "4":
      return "運用管理"
    case "5":
      return "事業継続性"
    default:
      return "不明なセクション"
  }
}

// リスクの高い項目を計算する関数
export function calculateItemRiskScores(assessment: any): any[] {
  const itemScores: any[] = []

  if (assessment?.answers) {
    for (const sectionId in assessment.answers) {
      const sectionAnswers = assessment.answers[sectionId]
      for (const questionId in sectionAnswers) {
        const answer = sectionAnswers[questionId]

        if (answer) {
          const riskFactor = riskFactorMapping[questionId]
          const section = allSections[sectionId as keyof typeof allSections]
          const question = section?.questions[questionId]

          if (riskFactor && question) {
            const score = answerToScoreMapping[answer] || 1
            const totalScore = score * riskFactor.weight // スコアに重みを掛ける

            let riskLevel: RiskLevel = RiskLevel.Medium
            if (totalScore >= 4) {
              riskLevel = RiskLevel.High
            } else if (totalScore >= 2) {
              riskLevel = RiskLevel.Medium
            } else {
              riskLevel = RiskLevel.Low
            }

            // 改善提案を生成 (例として、高リスクの場合のみ)
            let improvementSuggestion = null
            if (riskLevel === RiskLevel.High) {
              improvementSuggestion = `このリスクを軽減するために、${question.label}に関する対策を見直してください。`
            }

            itemScores.push({
              sectionName: getSectionNameJa(sectionId),
              questionLabel: question.label,
              answerLabel: getAnswerLabel(question, answer),
              riskLevel: riskLevel,
              score: totalScore,
              improvementSuggestion: improvementSuggestion,
            })
          }
        }
      }
    }
  }

  // スコアで降順にソート
  itemScores.sort((a, b) => b.score - a.score)

  return itemScores
}

// 質問の回答ラベルを取得する関数
function getAnswerLabel(question: any, answer: any): string {
  if (question.type === "select") {
    const option = question.options?.find((opt: any) => opt.value === answer)
    return option?.label || "不明"
  }
  return answer || "未回答"
}

// allSectionsをインポート
import { allSections } from "@/lib/questions"

