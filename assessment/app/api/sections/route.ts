import { NextResponse } from "next/server"
import { getAllSections } from "@/lib/assessment-service"

export async function GET() {
  try {
    const sections = await getAllSections()
    return NextResponse.json(sections)
  } catch (error) {
    console.error("セクション取得エラー:", error)
    return NextResponse.json({ error: "セクションの取得に失敗しました" }, { status: 500 })
  }
}

