import {
  createFacility,
  updateFacility,
  getFacility,
  getAllFacilities,
  deleteFacility,
  type FacilityData,
} from "./supabase-service"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "./supabase"

// 開発用のモックユーザーID - すべての操作で一貫して使用する固定値
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000000"

// 開発モードフラグ
const DEV_MODE = true

// 現在のユーザーIDを取得する関数
// 認証機能実装後に実際のユーザーIDを返すように修正
export async function getCurrentUserId(): Promise<string> {
  // 開発モードでは常に同じモックユーザーIDを返す
  if (DEV_MODE) {
    console.log("getCurrentUserId: 固定モックユーザーID使用", MOCK_USER_ID)
    return MOCK_USER_ID
  }

  // 認証機能実装後に以下のようにユーザーIDを取得
  // const { data: { user } } = await supabase.auth.getUser();
  // return user?.id || '';

  // 認証機能が実装されるまではモックIDを返す
  return MOCK_USER_ID
}

// 外部キー制約をバイパスするための関数を修正
async function bypassForeignKeyConstraint(userId: string): Promise<string> {
  try {
    console.log("bypassForeignKeyConstraint: 検証開始", userId)

    // 開発モードでは常に固定のユーザーIDを使用
    if (DEV_MODE) {
      // usersテーブルにダミーユーザーが存在するか確認
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", MOCK_USER_ID)
        .maybeSingle()

      if (existingUser) {
        console.log("bypassForeignKeyConstraint: 固定ユーザーID存在確認", MOCK_USER_ID)
        return MOCK_USER_ID
      }

      // 存在しない場合は、任意の既存ユーザーを検索
      console.log("bypassForeignKeyConstraint: 既存ユーザー検索開始")
      const { data: anyUser, error: fetchError } = await supabase.from("users").select("id").limit(1).single()

      if (fetchError) {
        console.warn("既存ユーザー検索中にエラーが発生しました:", fetchError)
      }

      if (anyUser && anyUser.id) {
        console.log(`bypassForeignKeyConstraint: 既存のユーザーID ${anyUser.id} を使用します`)
        return anyUser.id
      }

      // それでも見つからない場合は固定IDを返す
      console.log("bypassForeignKeyConstraint: 既存ユーザーが見つからないため固定IDを使用", MOCK_USER_ID)
      return MOCK_USER_ID
    }

    // 本番環境では渡されたユーザーIDをそのまま使用
    return userId
  } catch (error) {
    console.error("外部キー制約バイパス中にエラーが発生しました:", error)
    // エラーが発生した場合でも固定IDを返す
    return MOCK_USER_ID
  }
}

// 新規評価（施設）を作成する関数
export async function createNewFacility(data: {
  name: string
  location: string
  assessor: string
  assessment_date: string
}): Promise<FacilityData> {
  try {
    console.log("createNewFacility: 開始", data)

    // 固定のモックユーザーIDを使用
    const userId = MOCK_USER_ID
    console.log("createNewFacility: 使用するユーザーID", userId)

    // 外部キー制約をバイパスするために有効なユーザーIDを取得
    const validUserId = await bypassForeignKeyConstraint(userId)
    console.log("createNewFacility: 有効なユーザーID", validUserId)

    const facilityData: FacilityData = {
      id: uuidv4(),
      user_id: validUserId,
      name: data.name,
      location: data.location,
      assessor: data.assessor,
      assessment_date: data.assessment_date,
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("createNewFacility: 施設データ作成", facilityData)

    // Supabaseに施設データを保存
    const createdFacility = await createFacility(facilityData)
    console.log("createNewFacility: 施設作成完了", createdFacility)

    return createdFacility
  } catch (error) {
    console.error("施設作成エラー:", error)
    throw new Error("施設の作成に失敗しました")
  }
}

// ユーザーの全施設を取得する関数
export async function getUserFacilities(): Promise<FacilityData[]> {
  try {
    console.log("getUserFacilities: 開始")

    // 固定のモックユーザーIDを使用
    const userId = MOCK_USER_ID
    console.log("getUserFacilities: 使用するユーザーID", userId)

    // 外部キー制約をバイパスするために有効なユーザーIDを取得
    const validUserId = await bypassForeignKeyConstraint(userId)
    console.log("getUserFacilities: 有効なユーザーID", validUserId)

    const facilities = await getAllFacilities(validUserId)
    console.log("getUserFacilities: 取得した施設数", facilities.length)

    return facilities
  } catch (error) {
    console.error("施設取得エラー:", error)
    throw new Error("施設の取得に失敗しました")
  }
}

// 施設を更新する関数
export async function updateFacilityDetails(
  facilityId: string,
  data: Partial<Omit<FacilityData, "id" | "user_id" | "created_at" | "updated_at">>,
): Promise<FacilityData> {
  try {
    // 既存の施設を取得して権限チェック
    const existingFacility = await getFacility(facilityId)

    if (!existingFacility) {
      throw new Error("施設が見つかりません")
    }

    // 固定のモックユーザーIDを使用
    const userId = MOCK_USER_ID

    // 権限チェック（開発モードではスキップ可能）
    if (!DEV_MODE && existingFacility.user_id !== userId) {
      throw new Error("この施設を編集する権限がありません")
    }

    // 更新データを準備
    const updateData: Partial<FacilityData> & { id: string } = {
      id: facilityId,
      ...data,
      updated_at: new Date().toISOString(),
    }

    // Supabaseで施設を更新
    return await updateFacility(updateData)
  } catch (error) {
    console.error("施設更新エラー:", error)
    throw new Error("施設の更新に失敗しました")
  }
}

// 施設を削除する関数
export async function deleteFacilityById(facilityId: string): Promise<void> {
  try {
    // 既存の施設を取得して権限チェック
    const existingFacility = await getFacility(facilityId)

    if (!existingFacility) {
      throw new Error("施設が見つかりません")
    }

    // 固定のモックユーザーIDを使用
    const userId = MOCK_USER_ID

    // 権限チェック（開発モードではスキップ可能）
    if (!DEV_MODE && existingFacility.user_id !== userId) {
      throw new Error("この施設を削除する権限がありません")
    }

    // Supabaseで施設を削除
    await deleteFacility(facilityId)
  } catch (error) {
    console.error("施設削除エラー:", error)
    throw new Error("施設の削除に失敗しました")
  }
}

