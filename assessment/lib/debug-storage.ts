// デバッグ用のローカルストレージ監視ツール

// ローカルストレージのキープレフィックス
const STORAGE_KEY_PREFIX = "datacenter-assessment-"

// ローカルストレージの内容をコンソールに出力する関数
export function debugLocalStorage(): void {
  console.group("ローカルストレージの内容")

  let assessmentCount = 0
  const keys = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      assessmentCount++
      keys.push(key)

      try {
        const data = localStorage.getItem(key)
        const parsedData = data ? JSON.parse(data) : null
        console.log(`${key}:`, {
          id: parsedData?.id,
          name: parsedData?.name,
          updatedAt: parsedData?.updatedAt,
          answersCount: parsedData?.answers ? Object.keys(parsedData.answers).length : 0,
        })
      } catch (err) {
        console.error(`${key}: 解析エラー`, err)
      }
    }
  }

  console.log(`評価データの総数: ${assessmentCount}`)
  console.log("すべてのキー:", keys)
  console.groupEnd()

  return
}

// ローカルストレージの変更を監視する関数
export function monitorLocalStorage(): void {
  // ストレージイベントをリッスン
  window.addEventListener("storage", (event) => {
    if (event.key && event.key.startsWith(STORAGE_KEY_PREFIX)) {
      console.group("ローカルストレージの変更を検出")
      console.log("変更されたキー:", event.key)
      console.log("古い値:", event.oldValue ? JSON.parse(event.oldValue) : null)
      console.log("新しい値:", event.newValue ? JSON.parse(event.newValue) : null)
      console.groupEnd()
    }
  })

  console.log("ローカルストレージの監視を開始しました")
}

