import { NextResponse } from "next/server"
import { calculateAndSaveRiskScore } from "@/lib/risk-calculation"

export async function POST(request: Request) {
  try {
    const { facilityId } = await request.json()

    if (!facilityId) {
      return NextResponse.json({ error: "facilityId is required" }, { status: 400 })
    }

    console.log(`APIルート: 施設ID ${facilityId} のリスクスコアを計算します`)
    const result = await calculateAndSaveRiskScore(facilityId)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("リスクスコア計算エラー:", error)
    return NextResponse.json({ error: "Failed to calculate risk score" }, { status: 500 })
  }
}

