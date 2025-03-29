import { createClient } from "@/utils/supabase/client"

/**
 * 全ての質問を取得する
 * @returns 質問データ
 */
export async function getQuestions() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("questions").select("*").order("display_order", { ascending: true })

    if (error) {
      console.error("質問の取得に失敗しました:", error)
      throw new Error("質問データの取得に失敗しました")
    }

    return data || []
  } catch (error) {
    console.error("質問の取得中にエラーが発生しました:", error)
    throw new Error("質問データの取得に失敗しました")
  }
}

/**
 * 特定の施設の回答を取得する
 * @param facilityId 施設ID
 * @returns 回答データ
 */
export async function getAnswers(facilityId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("answers").select("*").eq("facility_id", facilityId)

    if (error) {
      console.error("回答の取得に失敗しました:", error)
      throw new Error("回答データの取得に失敗しました")
    }

    return data || []
  } catch (error) {
    console.error("回答の取得中にエラーが発生しました:", error)
    throw new Error("回答データの取得に失敗しました")
  }
}

/**
 * セクションに属する質問を取得する
 * @param sectionId セクションID
 * @returns 質問データ
 */
export async function getQuestionsBySection(sectionId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("section_id", sectionId)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("質問の取得に失敗しました:", error)
      throw new Error("質問データの取得に失敗しました")
    }

    return data || []
  } catch (error) {
    console.error("質問の取得中にエラーが発生しました:", error)
    throw new Error("質問データの取得に失敗しました")
  }
}

/**
 * 質問に対するオプションを取得する
 * @param questionId 質問ID
 * @returns オプションデータ
 */
export async function getOptionsByQuestion(questionId: string) {
  try {
    const supabase = createClient()
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("options")
      .eq("id", questionId)
      .single()

    if (questionError) {
      console.error("質問の取得に失敗しました:", questionError)
      throw new Error("オプションデータの取得に失敗しました")
    }

    // optionsがJSONB型の場合、すでに配列として取得されている
    return question?.options || []
  } catch (error) {
    console.error("オプションの取得中にエラーが発生しました:", error)
    throw new Error("オプションデータの取得に失敗しました")
  }
}

/**
 * 全てのセクションを取得する
 * @returns セクションデータ
 */
export async function getSections() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("sections").select("*").order("display_order", { ascending: true })

    if (error) {
      console.error("セクションの取得に失敗しました:", error)
      throw new Error("セクションデータの取得に失敗しました")
    }

    return data || []
  } catch (error) {
    console.error("セクションの取得中にエラーが発生しました:", error)
    throw new Error("セクションデータの取得に失敗しました")
  }
}

/**
 * セクション名を取得する
 * @param sectionId セクションID
 * @returns セクション名
 */
export async function getSectionName(sectionId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("sections").select("name").eq("id", sectionId).single()

    if (error) {
      console.error("セクションの取得に失敗しました:", error)
      throw new Error("セクション名の取得に失敗しました")
    }

    return data?.name || ""
  } catch (error) {
    console.error("セクション名の取得中にエラーが発生しました:", error)
    throw new Error("セクション名の取得に失敗しました")
  }
}

