import { NextResponse } from "next/server"
import { getAnswersForFacility } from "@/lib/assessment-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get("assessmentId")

    if (!assessmentId) {
      return NextResponse.json({ error: "assessmentIdが必要です" }, { status: 400 })
    }

    const answers = await getAnswersForFacility(assessmentId)
    return NextResponse.json(answers)
  } catch (error) {
    console.error("回答取得エラー:", error)
    return NextResponse.json({ error: "回答の取得に失敗しました" }, { status: 500 })
  }
}

