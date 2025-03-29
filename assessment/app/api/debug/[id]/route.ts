import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAnswers } from "@/lib/supabase-service"
import { convertFacilityToAssessment, getFacility } from "@/lib/assessment-service"
import { calculateAssessmentRiskScore } from "@/lib/risk-assessment"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const facilityId = params.id

    // 施設データを取得
    const facility = await getFacility(facilityId)
    if (!facility) {
      return NextResponse.json({ error: "施設データが見つかりません" }, { status: 404 })
    }

    // 回答データを取得
    const answers = await getSupabaseAnswers(facilityId)
    console.log(`取得した回答データ: ${answers.length}件`)

    // 評価データに変換
    const assessment = convertFacilityToAssessment(facility, answers)

    // リスクスコアを計算
    const riskScore = calculateAssessmentRiskScore(assessment)

    return NextResponse.json({
      facility,
      answersCount: answers.length,
      answers,
      assessment,
      riskScore,
    })
  } catch (error) {
    console.error("デバッグAPIエラー:", error)
    return NextResponse.json({ error: "デバッグ情報の取得に失敗しました" }, { status: 500 })
  }
}

