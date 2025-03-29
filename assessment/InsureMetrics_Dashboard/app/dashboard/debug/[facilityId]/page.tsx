import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

// JSONBデータを処理する関数 - 単一要素配列[5]形式に特化
function processJsonbData(rawData: any): {
  processedIds: number[]
  processingSteps: string[]
  originalType: string
  originalValue: any
} {
  const steps: string[] = []
  let processedIds: number[] = []

  try {
    steps.push(`元のデータ型: ${typeof rawData}`)

    // 単一要素配列[5]形式の処理
    if (Array.isArray(rawData)) {
      steps.push(`配列として処理: 長さ ${rawData.length}`)

      // 配列の各要素を処理
      for (let i = 0; i < rawData.length; i++) {
        const element = rawData[i]
        steps.push(`配列要素[${i}]: ${element} (型: ${typeof element})`)

        // 数値に変換
        const numId = typeof element === "number" ? element : Number(element)
        steps.push(`数値変換結果: ${numId} (${isNaN(numId) ? "変換失敗" : "変換成功"})`)

        if (!isNaN(numId)) {
          processedIds.push(numId)
        }
      }
    }
    // その他の形式も処理（念のため）
    else if (rawData === null || rawData === undefined) {
      steps.push("nullまたはundefinedのため、空配列を返します")
    } else if (typeof rawData === "string") {
      steps.push("文字列として処理を開始")
      try {
        const parsed = JSON.parse(rawData)
        steps.push(`パース結果の型: ${typeof parsed}`)

        if (Array.isArray(parsed)) {
          steps.push("パースした結果は配列です")
          processedIds = parsed.map((id) => Number(id)).filter((id) => !isNaN(id))
          steps.push(`配列の要素を数値に変換: ${processedIds.join(", ")}`)
        } else if (typeof parsed === "number") {
          steps.push("パースした結果は数値です")
          processedIds = [parsed]
        }
      } catch (e) {
        steps.push(`JSONパースに失敗: ${e.message}`)
        const num = Number(rawData)
        if (!isNaN(num)) {
          steps.push(`文字列を直接数値に変換: ${num}`)
          processedIds = [num]
        }
      }
    } else if (typeof rawData === "number") {
      steps.push("数値として処理")
      processedIds = [rawData]
    } else if (rawData && typeof rawData === "object") {
      steps.push("オブジェクトとして処理")
      const values = Object.values(rawData)
      processedIds = values.map((id) => Number(id)).filter((id) => !isNaN(id))
    }

    steps.push(`最終結果: ${processedIds.length > 0 ? processedIds.join(", ") : "(変換失敗)"}`)
  } catch (error) {
    steps.push(`エラー発生: ${error.message}`)
  }

  return {
    processedIds,
    processingSteps: steps,
    originalType: typeof rawData,
    originalValue: rawData,
  }
}

export default async function FacilityDebugPage({ params }: { params: { facilityId: string } }) {
  const facilityId = params.facilityId

  // 施設データを取得
  const { data: facility, error: facilityError } = await supabase
    .from("facilities")
    .select("id, name")
    .eq("id", facilityId)
    .single()

  if (facilityError || !facility) {
    return notFound()
  }

  // この施設の回答を取得
  const { data: answers, error: answersError } = await supabase
    .from("answers")
    .select("id, facility_id, question_id, selected_option_ids")
    .eq("facility_id", facilityId)

  // 質問オプションデータを取得
  const { data: questionOptions, error: optionsError } = await supabase
    .from("question_options")
    .select("option_id, question_id, category, risk_factor, risk_score, weight")

  // 回答に関連する質問IDを取得
  const questionIds = answers?.map((a) => a.question_id) || []

  // 関連する質問オプションを取得
  const relatedOptions = questionOptions?.filter((o) => questionIds.includes(o.question_id)) || []

  // 選択されたオプションIDを処理
  const processedAnswers =
    answers?.map((answer) => {
      const result = processJsonbData(answer.selected_option_ids)
      return {
        answerId: answer.id,
        questionId: answer.question_id,
        ...result,
      }
    }) || []

  // 全ての処理済みオプションIDを取得
  const allProcessedOptionIds = processedAnswers.flatMap((pa) => pa.processedIds)

  // 選択されたオプションに一致するオプションを取得する部分を改善
  const matchingOptions =
    questionOptions?.filter((o) => {
      const optionIdInt = typeof o.option_id === "number" ? o.option_id : Number(o.option_id)

      // 厳密な数値比較
      return allProcessedOptionIds.some((id) => id === optionIdInt)
    }) || []

  // カテゴリごとのスコア計算をシミュレート
  const categoryScores: { [key: string]: { total: number; count: number } } = {}

  if (answers && questionOptions) {
    for (const answer of processedAnswers) {
      const relatedOpts = questionOptions.filter((o) => o.question_id === answer.questionId)

      for (const optionId of answer.processedIds) {
        // 整数型として比較
        const option = relatedOpts.find((o) => {
          const optionIdInt = typeof o.option_id === "number" ? o.option_id : Number(o.option_id)

          return optionIdInt === optionId
        })

        if (option) {
          if (!categoryScores[option.category]) {
            categoryScores[option.category] = { total: 0, count: 0 }
          }

          categoryScores[option.category].total += option.risk_score * option.weight
          categoryScores[option.category].count += 1
        }
      }
    }
  }

  // すべてのカテゴリを取得
  const allCategories = [...new Set(questionOptions?.map((o) => o.category) || [])]

  // 各カテゴリのスコアとリスクレベルを計算
  const categoryResults = allCategories.map((category) => {
    const scores = categoryScores[category]
    if (!scores) {
      return {
        category,
        score: -1,
        level: "none",
        reason: "回答データなし",
      }
    }

    const averageScore = scores.count > 0 ? scores.total / scores.count : 0
    let level
    if (averageScore < 1.0) {
      level = "low"
    } else if (averageScore < 2.0) {
      level = "medium"
    } else {
      level = "high"
    }

    return {
      category,
      score: averageScore,
      level,
      reason: scores.count > 0 ? `${scores.count}件の回答から計算` : "回答なし",
    }
  })

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">施設デバッグ: {facility.name}</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>施設情報</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>ID:</strong> {facility.id}
            </p>
            <p>
              <strong>名前:</strong> {facility.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>回答データ ({answers?.length || 0}件)</CardTitle>
          </CardHeader>
          <CardContent>
            {answersError ? (
              <p className="text-red-500">エラー: {answersError.message}</p>
            ) : answers && answers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">回答ID</th>
                      <th className="p-2 border">質問ID</th>
                      <th className="p-2 border">選択オプションID (元の値)</th>
                      <th className="p-2 border">データ型</th>
                      <th className="p-2 border">処理後のオプションID</th>
                      <th className="p-2 border">変換成功</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedAnswers.map((answer) => (
                      <tr key={answer.answerId}>
                        <td className="p-2 border">{answer.answerId}</td>
                        <td className="p-2 border">{answer.questionId}</td>
                        <td className="p-2 border">
                          <pre className="text-xs overflow-auto max-w-xs">
                            {JSON.stringify(answer.originalValue, null, 2)}
                          </pre>
                        </td>
                        <td className="p-2 border">{answer.originalType}</td>
                        <td className="p-2 border">
                          {answer.processedIds.length > 0 ? (
                            answer.processedIds.join(", ")
                          ) : (
                            <span className="text-red-500">変換失敗</span>
                          )}
                        </td>
                        <td className="p-2 border">
                          {answer.processedIds.length > 0 ? (
                            <span className="text-green-500">成功</span>
                          ) : (
                            <span className="text-red-500">失敗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-yellow-500">この施設の回答データがありません</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JSONB型データの詳細分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="font-medium">JSONB型データの処理方法:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>PostgreSQLのJSONB型は、JavaScriptでは通常オブジェクトまたは配列として取得されます</li>
                <li>配列の場合は直接数値に変換し、オブジェクトの場合は値を抽出して変換します</li>
                <li>変換後の数値を使用して、option_idと比較します</li>
              </ol>

              <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4">
                <h3 className="font-bold text-yellow-800 mb-2">JSONB型データの処理ステップ</h3>
                {processedAnswers.length > 0 ? (
                  <div className="space-y-6">
                    {processedAnswers.slice(0, 3).map((answer) => (
                      <div key={answer.answerId} className="bg-white p-4 rounded border">
                        <p className="font-semibold mb-2">回答ID: {answer.answerId}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium">元のデータ:</p>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                              {JSON.stringify(answer.originalValue, null, 2)}
                            </pre>
                            <p className="mt-2">
                              <strong>データ型:</strong> {answer.originalType}
                            </p>
                            <p>
                              <strong>処理結果:</strong>{" "}
                              {answer.processedIds.length > 0 ? answer.processedIds.join(", ") : "(変換失敗)"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">処理ステップ:</p>
                            <ol className="list-decimal pl-5 text-xs space-y-1">
                              {answer.processingSteps.map((step, index) => (
                                <li
                                  key={index}
                                  className={
                                    step.includes("失敗") || step.includes("エラー")
                                      ? "text-red-600"
                                      : step.includes("成功")
                                        ? "text-green-600"
                                        : ""
                                  }
                                >
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>サンプルデータがありません</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>関連する質問オプション ({relatedOptions.length}件)</CardTitle>
          </CardHeader>
          <CardContent>
            {optionsError ? (
              <p className="text-red-500">エラー: {optionsError.message}</p>
            ) : relatedOptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">オプションID</th>
                      <th className="p-2 border">データ型</th>
                      <th className="p-2 border">数値変換後</th>
                      <th className="p-2 border">質問ID</th>
                      <th className="p-2 border">カテゴリ</th>
                      <th className="p-2 border">リスク要因</th>
                      <th className="p-2 border">リスクスコア</th>
                      <th className="p-2 border">重み</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedOptions.map((option) => (
                      <tr key={String(option.option_id)}>
                        <td className="p-2 border">{String(option.option_id)}</td>
                        <td className="p-2 border">{typeof option.option_id}</td>
                        <td className="p-2 border">{Number(option.option_id)}</td>
                        <td className="p-2 border">{option.question_id}</td>
                        <td className="p-2 border">{option.category}</td>
                        <td className="p-2 border">{option.risk_factor}</td>
                        <td className="p-2 border">{option.risk_score}</td>
                        <td className="p-2 border">{option.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-yellow-500">関連する質問オプションがありません</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              選択されたオプション ({matchingOptions.length}/{allProcessedOptionIds.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">処理済み選択オプションID:</h3>
              <p className="bg-gray-100 p-2 rounded">{allProcessedOptionIds.join(", ") || "(なし)"}</p>
            </div>

            {allProcessedOptionIds.length === 0 ? (
              <p className="text-yellow-500">選択されたオプションがありません</p>
            ) : matchingOptions.length === 0 ? (
              <p className="text-red-500">選択されたオプションに一致するデータがありません</p>
            ) : matchingOptions.length < allProcessedOptionIds.length ? (
              <p className="text-yellow-500">一部の選択されたオプションに一致するデータがありません</p>
            ) : null}

            {matchingOptions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">オプションID</th>
                      <th className="p-2 border">データ型</th>
                      <th className="p-2 border">数値変換後</th>
                      <th className="p-2 border">質問ID</th>
                      <th className="p-2 border">カテゴリ</th>
                      <th className="p-2 border">リスク要因</th>
                      <th className="p-2 border">リスクスコア</th>
                      <th className="p-2 border">重み</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchingOptions.map((option) => (
                      <tr key={String(option.option_id)}>
                        <td className="p-2 border">{String(option.option_id)}</td>
                        <td className="p-2 border">{typeof option.option_id}</td>
                        <td className="p-2 border">{Number(option.option_id)}</td>
                        <td className="p-2 border">{option.question_id}</td>
                        <td className="p-2 border">{option.category}</td>
                        <td className="p-2 border">{option.risk_factor}</td>
                        <td className="p-2 border">{option.risk_score}</td>
                        <td className="p-2 border">{option.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別スコア計算結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">カテゴリ</th>
                    <th className="p-2 border">スコア</th>
                    <th className="p-2 border">リスクレベル</th>
                    <th className="p-2 border">理由</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryResults.map((result) => (
                    <tr key={result.category}>
                      <td className="p-2 border">{result.category}</td>
                      <td className="p-2 border">{result.score === -1 ? "N/A" : result.score.toFixed(2)}</td>
                      <td className="p-2 border">
                        <span
                          className={`px-2 py-1 rounded ${
                            result.level === "low"
                              ? "bg-green-100 text-green-800"
                              : result.level === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : result.level === "high"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {result.level === "low"
                            ? "低"
                            : result.level === "medium"
                              ? "中"
                              : result.level === "high"
                                ? "高"
                                : "なし"}
                        </span>
                      </td>
                      <td className="p-2 border">{result.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>診断結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!facility && <p className="text-red-500">問題: 施設が存在しません</p>}

              {(!answers || answers.length === 0) && (
                <p className="text-red-500">問題: この施設の回答データがありません</p>
              )}

              {processedAnswers.some((pa) => pa.processedIds.length === 0) && (
                <p className="text-red-500">問題: 一部の回答のJSONB型データを数値に変換できませんでした</p>
              )}

              {answers && answers.length > 0 && relatedOptions.length === 0 && (
                <p className="text-red-500">問題: 回答に関連する質問オプションがありません</p>
              )}

              {allProcessedOptionIds.length > 0 && matchingOptions.length === 0 && (
                <p className="text-red-500">
                  問題: 選択されたオプションIDに一致するオプションがありません（型の不一致の可能性）
                </p>
              )}

              {allProcessedOptionIds.length > 0 &&
                matchingOptions.length > 0 &&
                matchingOptions.length < allProcessedOptionIds.length && (
                  <p className="text-red-500">
                    問題: 一部の選択されたオプションIDに一致するオプションがありません（型の不一致の可能性）
                  </p>
                )}

              {Object.keys(categoryScores).length === 0 && (
                <p className="text-red-500">問題: カテゴリごとのスコアが計算できませんでした</p>
              )}

              {facility &&
                answers &&
                answers.length > 0 &&
                relatedOptions.length > 0 &&
                matchingOptions.length === allProcessedOptionIds.length &&
                Object.keys(categoryScores).length > 0 && (
                  <p className="text-green-500">
                    すべてのデータが正常に存在しています。リスクスコアが表示されない他の原因を確認してください。
                  </p>
                )}

              <div className="mt-4 p-4 bg-blue-50 rounded">
                <h3 className="font-bold text-blue-800 mb-2">単一要素配列[5]形式のJSONBデータ処理</h3>
                <p className="text-blue-800 mb-2">
                  answersテーブルのselected_option_idsが<code>[5]</code>のような単一要素配列として保存されている場合、
                  以下の点に注意してください：
                </p>
                <ol className="list-decimal pl-5 text-blue-800 space-y-1">
                  <li>配列の要素が数値型であることを確認する（文字列ではなく）</li>
                  <li>配列から取り出した値を明示的に数値型に変換する</li>
                  <li>option_idとの比較時に型の一致を確認する</li>
                  <li>デバッグ情報で型変換の各ステップを確認する</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

