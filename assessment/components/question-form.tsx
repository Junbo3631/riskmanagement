"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, Save, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveSectionAnswersToSupabase } from "@/lib/assessment-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Question, Answer } from "@/types"

interface QuestionFormProps {
  questions: Question[]
  assessmentId: string
  sectionId: number
  datacenterName: string
  existingAnswers?: Answer[]
  onSaved?: () => void
}

function QuestionForm({
  questions,
  assessmentId,
  sectionId,
  datacenterName,
  existingAnswers = [],
  onSaved,
}: QuestionFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<number, string | string[] | number | Date>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // 既存の回答をフォームにセット
  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0) {
      const initialAnswers: Record<number, string | string[] | number | Date> = {}

      existingAnswers.forEach((answer) => {
        const questionId = answer.question_id

        if (answer.selected_options && answer.selected_options.length > 0) {
          // 選択肢の回答
          initialAnswers[questionId] = answer.selected_options
        } else if (answer.numeric_value !== null && answer.numeric_value !== undefined) {
          // 数値の回答
          initialAnswers[questionId] = answer.numeric_value
        } else if (answer.value) {
          // テキストの回答
          if (getQuestionType({ id: questionId } as Question) === "assessment_date" && questionId !== 1004) {
            // 評価日の場合はDate型に変換（ただし質問ID 1004は除外）
            try {
              initialAnswers[questionId] = new Date(answer.value)
            } catch (e) {
              console.error("日付の変換エラー:", e)
              initialAnswers[questionId] = answer.value
            }
          } else {
            initialAnswers[questionId] = answer.value
          }
        }
      })

      setAnswers(initialAnswers)
    }
  }, [existingAnswers])

  // 回答の変更を処理
  const handleAnswerChange = (questionId: number, value: string | string[] | number | Date) => {
    console.log(`回答変更: ID=${questionId}, 値=${value}`)
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  // 日付の変更を処理
  const handleDateChange = (questionId: number, date: Date | undefined) => {
    if (date) {
      console.log(`日付変更: ID=${questionId}, 日付=${date}`)
      setAnswers((prev) => ({
        ...prev,
        [questionId]: date,
      }))
    }
  }

  // 回答を保存
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // 回答データを処理
      const processedAnswers = processQuestionData(questions, answers)

      try {
        // ローカルストレージに保存
        import("@/lib/assessment-service").then(({ saveAnswersToLocalStorage }) => {
          saveAnswersToLocalStorage(assessmentId, sectionId, processedAnswers)
        })

        // Supabaseに保存
        await saveSectionAnswersToSupabase(assessmentId, sectionId, processedAnswers, datacenterName)

        // 成功メッセージを表示
        setSuccess("回答が正常に保存されました")

        // 3秒後に保存完了後の処理を実行
        setTimeout(() => {
          if (onSaved) {
            onSaved()
          }
        }, 1500)
      } catch (err) {
        console.error("回答保存エラー:", err)

        // エラーメッセージを表示
        if (err.message && err.message.includes("Failed to fetch")) {
          setError(
            "サーバーへの接続に失敗しました。ネットワーク接続を確認してください。回答はローカルに保存されています。",
          )
        } else {
          setError(`回答の保存中にエラーが発生しました: ${err.message || "不明なエラー"}`)
        }

        // エラーが発生しても、ローカルストレージには保存されているので
        // 一定時間後に成功メッセージを表示
        setTimeout(() => {
          setError(null)
          setSuccess("回答がローカルに保存されました。オンラインに戻ったときに同期されます。")
        }, 3000)
      }
    } catch (err) {
      console.error("回答処理エラー:", err)
      setError(`回答の処理中にエラーが発生しました: ${err.message || "不明なエラー"}`)
    } finally {
      setSaving(false)
    }
  }

  // 回答データを処理する関数
  const processQuestionData = (
    questions: Question[],
    answers: Record<number, string | string[] | number | Date>,
  ): Answer[] => {
    return questions
      .filter((question) => answers[question.id] !== undefined)
      .map((question) => {
        const answer = answers[question.id]
        const questionType = getQuestionType(question)
        const answerData: Answer = {
          id: "", // Supabaseが自動生成
          facility_id: assessmentId,
          question_id: question.id,
          selected_options: null,
          value: null,
          numeric_value: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // 回答の種類に応じて適切なフィールドに値をセット
        if (Array.isArray(answer)) {
          // 選択肢の回答
          answerData.selected_options = answer
        } else if (typeof answer === "number") {
          // 数値の回答
          answerData.numeric_value = answer
        } else if (answer instanceof Date) {
          // 日付の回答（文字列に変換）
          answerData.value = format(answer, "yyyy-MM-dd")
        } else if (typeof answer === "string") {
          // 特定の質問タイプの場合は強制的に処理
          if (
            questionType === "total_area" ||
            questionType === "it_capacity" ||
            questionType === "construction_year" ||
            questionType === "last_renovation_year"
          ) {
            const numValue = Number.parseFloat(answer)
            if (!isNaN(numValue)) {
              answerData.numeric_value = numValue
            } else {
              // 数値に変換できない場合はテキストとして保存
              answerData.value = answer
            }
          } else {
            // 数値として解釈できる場合は数値として保存
            const numValue = Number.parseFloat(answer)
            if (!isNaN(numValue) && /^\d+(\.\d+)?$/.test(answer)) {
              answerData.numeric_value = numValue
            } else {
              // それ以外はテキストとして保存
              answerData.value = answer
            }
          }
        }

        return answerData
      })
  }

  // 質問の種類を判定する関数
  const getQuestionType = (question: Question): string => {
    // 質問IDから質問の種類を判定
    const questionId = question.id

    // 質問テキストに基づく判定（IDが一致しない場合のフォールバック）
    const questionText = question.text?.toLowerCase() || ""

    // 基本情報セクションの質問（セクションID=1）
    if (Math.floor(questionId / 1000) === 1) {
      // 特定の質問IDに基づいて種類を判定
      if (questionId === 1001) return "datacenter_name" // データセンター名
      if (questionId === 1002) return "location" // 所在地
      if (questionId === 1003) return "assessor" // 評価者
      if (questionId === 1004) return "assessment_date_text" // 評価日（テキスト入力）
      if (questionId === 1007) return "total_area" // 総床面積
      if (questionId === 1008) return "it_capacity" // IT容量
      if (questionId === 1009) return "construction_year" // 建設年
      if (questionId === 1010) return "last_renovation_year" // 最終改修年
      if (questionId === 1011) return "remarks" // 備考
    }

    // 評価日の判定（質問ID 1004以外で評価日に関するテキストを含む場合）
    if (
      questionId !== 1004 &&
      (questionText.includes("評価日") || questionText.includes("実施日") || questionText.includes("日付"))
    ) {
      return "assessment_date"
    }

    // 選択肢がある場合は選択式
    if (question.options) return "selection"

    // それ以外は自由記述
    return "free_text"
  }

  // optionsの処理
  const processOptions = (options: any): string[] => {
    if (!options) return []

    // 文字列の場合はJSONとしてパース
    if (typeof options === "string") {
      try {
        const parsedOptions = JSON.parse(options)
        if (Array.isArray(parsedOptions)) {
          // 単純な文字列の配列の場合
          if (parsedOptions.every((opt) => typeof opt === "string")) {
            return parsedOptions
          }
          // {label, value}形式のオブジェクトの配列の場合
          if (parsedOptions.every((opt) => opt && typeof opt === "object" && "label" in opt)) {
            return parsedOptions.map((opt) => opt.label)
          }
        }
        return []
      } catch (e) {
        console.error("オプションのパースエラー:", e)
        return []
      }
    }

    // 既にオブジェクトの配列の場合
    if (Array.isArray(options)) {
      // 単純な文字列の配列の場合
      if (options.every((opt) => typeof opt === "string")) {
        return options
      }
      // {label, value}形式のオブジェクトの配列の場合
      if (options.every((opt) => opt && typeof opt === "object" && "label" in opt)) {
        return options.map((opt) => opt.label)
      }
    }

    return []
  }

  // 質問が回答済みかどうかを判定
  const isQuestionAnswered = (questionId: number): boolean => {
    return answers[questionId] !== undefined
  }

  // デバッグ用：質問IDと質問タイプのマッピングをログに出力
  useEffect(() => {
    if (questions.length > 0) {
      console.log("質問IDと質問タイプのマッピング:")
      const debugLines: string[] = []

      questions.forEach((q) => {
        const type = getQuestionType(q)
        console.log(`ID: ${q.id}, テキスト: ${q.text}, タイプ: ${type}`)
        debugLines.push(`ID: ${q.id}, テキスト: ${q.text}, タイプ: ${type}`)
      })

      setDebugInfo(debugLines.join("\n"))
    }
  }, [questions])

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 mb-6">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700">成功</AlertTitle>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {questions.map((question) => {
        const questionType = getQuestionType(question)
        const isAnswered = isQuestionAnswered(question.id)

        return (
          <div
            key={question.id}
            className={`bg-white border rounded-lg overflow-hidden transition-all ${
              isAnswered ? "border-green-200" : "border-gray-200"
            }`}
          >
            <div className="p-5 border-b bg-gray-50">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${isAnswered ? "text-green-500" : "text-gray-400"}`}>
                  {isAnswered ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-800 font-medium">{question.text}</h3>
                  {question.description && <p className="text-gray-600 text-sm mt-1">{question.description}</p>}
                </div>
                {question.help_text && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                        <HelpCircle className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 text-sm">
                      <p className="text-gray-700">{question.help_text}</p>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div className="p-5">
              {/* 質問の種類に応じたフォーム要素を表示 */}
              {questionType === "datacenter_name" && (
                // データセンター名（テキスト入力、一行分）
                <div className="flex flex-col space-y-2">
                  <Input
                    type="text"
                    value={answers[question.id] !== undefined ? String(answers[question.id]) : ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="データセンター名を入力してください"
                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
                  />
                </div>
              )}

              {(questionType === "location" || questionType === "assessor") && (
                // 所在地、評価者（テキスト入力、一行分）
                <div className="flex flex-col space-y-2">
                  <Input
                    type="text"
                    value={answers[question.id] !== undefined ? String(answers[question.id]) : ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={
                      questionType === "location"
                        ? "所在地を入力してください"
                        : questionType === "assessor"
                          ? "評価者名を入力してください"
                          : question.description || ""
                    }
                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
                  />
                </div>
              )}

              {questionType === "assessment_date_text" && (
                // 評価日（テキスト入力、一行分）
                <div className="flex flex-col space-y-2">
                  <Input
                    type="text"
                    value={answers[question.id] !== undefined ? String(answers[question.id]) : ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="評価日を入力してください（例：2023-01-01）"
                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
                  />
                </div>
              )}

              {questionType === "assessment_date" && (
                // 評価日（カレンダー）
                <div className="flex flex-col space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !answers[question.id] && "text-gray-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {answers[question.id] instanceof Date
                          ? format(answers[question.id] as Date, "yyyy年MM月dd日", { locale: ja })
                          : "日付を選択してください"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={answers[question.id] instanceof Date ? (answers[question.id] as Date) : undefined}
                        onSelect={(date) => handleDateChange(question.id, date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {(questionType === "construction_year" || questionType === "last_renovation_year") && (
                // 建設年、最終改修年（数値入力、一行分）
                <div className="flex flex-col space-y-2">
                  <div className="h-10 min-h-[40px]">
                    <Input
                      type="number"
                      value={answers[question.id] !== undefined ? String(answers[question.id]) : ""}
                      onChange={(e) => {
                        const value = e.target.value ? Number.parseFloat(e.target.value) : ""
                        handleAnswerChange(question.id, value)
                      }}
                      placeholder={
                        questionType === "construction_year"
                          ? "建設年（西暦）"
                          : questionType === "last_renovation_year"
                            ? "最終改修年（西暦）"
                            : question.description || ""
                      }
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
                      style={{ height: "40px" }}
                    />
                  </div>
                </div>
              )}

              {(questionType === "total_area" || questionType === "it_capacity") && (
                // 総床面積、IT容量（数値入力、一行分）
                <div className="flex flex-col space-y-2">
                  <Input
                    type="number"
                    value={answers[question.id] !== undefined ? String(answers[question.id]) : ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number.parseFloat(e.target.value) : ""
                      handleAnswerChange(question.id, value)
                    }}
                    placeholder={
                      questionType === "total_area"
                        ? "総床面積（m²）"
                        : questionType === "it_capacity"
                          ? "IT容量（kW）"
                          : question.description || ""
                    }
                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
                  />
                </div>
              )}

              {questionType === "selection" && (
                // 選択肢がある場合はラジオボタンを表示
                <RadioGroup
                  value={
                    answers[question.id]
                      ? Array.isArray(answers[question.id])
                        ? answers[question.id][0]
                        : String(answers[question.id])
                      : undefined
                  }
                  onValueChange={(value) => handleAnswerChange(question.id, [value])}
                  className="space-y-2"
                >
                  {processOptions(question.options).map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <RadioGroupItem value={option} id={`option-${question.id}-${index}`} />
                      <Label htmlFor={`option-${question.id}-${index}`} className="flex-1 cursor-pointer text-gray-800">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {questionType === "free_text" && (
                // 自由記述
                <div className="flex flex-col space-y-2">
                  <Textarea
                    value={answers[question.id] !== undefined ? String(answers[question.id]) : ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={question.description || ""}
                    rows={4}
                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {questionType === "remarks" && (
                // 備考（テキスト入力、一行分）
                <div className="flex flex-col space-y-2">
                  <div className="h-10 min-h-[40px]">
                    <Input
                      type="text"
                      value={answers[question.id] !== undefined ? String(answers[question.id]) : ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="備考を入力してください"
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
                      style={{ height: "40px" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div className="flex justify-end mt-8 sticky bottom-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-md shadow-md"
          size="lg"
        >
          <Save className="h-4 w-4" />
          {saving ? "保存中..." : "回答を保存"}
        </Button>
      </div>
    </div>
  )
}

// デフォルトエクスポートと名前付きエクスポートの両方を提供
export default QuestionForm
export { QuestionForm }

