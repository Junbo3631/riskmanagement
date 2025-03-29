import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 環境変数からSupabaseの設定を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Supabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: Request) {
  try {
    const { datacenter } = await request.json()

    // 広島データセンターの施設を検索
    const { data: facilities, error: facilitiesError } = await supabase
      .from("facilities")
      .select("*")
      .ilike("name", `%${datacenter}%`)

    if (facilitiesError) {
      console.error("施設データ取得エラー:", facilitiesError)
      return NextResponse.json({ error: "施設データの取得に失敗しました" }, { status: 500 })
    }

    if (!facilities || facilities.length === 0) {
      return NextResponse.json({ error: `${datacenter}データセンターが見つかりません` }, { status: 404 })
    }

    const facility = facilities[0]

    // リスクスコアを取得
    const { data: riskScore, error: riskScoreError } = await supabase
      .from("risk_scores")
      .select("*")
      .eq("facility_id", facility.id)
      .single()

    if (riskScoreError && riskScoreError.code !== "PGRST116") {
      // PGRST116 は "結果が見つからない" エラー
      console.error("リスクスコア取得エラー:", riskScoreError)
      return NextResponse.json({ error: "リスクスコアの取得に失敗しました" }, { status: 500 })
    }

    // 回答データを取得
    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("*")
      .eq("facility_id", facility.id)

    if (answersError) {
      console.error("回答データ取得エラー:", answersError)
      return NextResponse.json({ error: "回答データの取得に失敗しました" }, { status: 500 })
    }

    // 質問データを取得
    const { data: questions, error: questionsError } = await supabase.from("questions").select("*")

    if (questionsError) {
      console.error("質問データ取得エラー:", questionsError)
      return NextResponse.json({ error: "質問データの取得に失敗しました" }, { status: 500 })
    }

    // セクションデータを取得
    const { data: sections, error: sectionsError } = await supabase.from("sections").select("*")

    if (sectionsError) {
      console.error("セクションデータ取得エラー:", sectionsError)
      return NextResponse.json({ error: "セクションデータの取得に失敗しました" }, { status: 500 })
    }

    // 検証結果を返す
    return NextResponse.json({
      facility,
      riskScore: riskScore || null,
      answerCount: answers?.length || 0,
      questionCount: questions?.length || 0,
      sectionCount: sections?.length || 0,
      message: `${datacenter}データセンターのリスクスコア検証が完了しました`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("リスクスコア検証エラー:", error)
    return NextResponse.json({ error: "リスクスコアの検証中にエラーが発生しました" }, { status: 500 })
  }
}

