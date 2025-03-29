"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  getQuestionsForSection,
  getAnswersForSection,
  getSectionById,
  getAssessmentById,
  getAnswersFromLocalStorage,
} from "@/lib/assessment-service"
import type { Question, Answer, Section } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/header"
import { EvaluationCriteriaSection } from "@/components/evaluation-criteria-section"
import { ArrowLeft, HelpCircle, ClipboardList } from "lucide-react"
import { QuestionForm } from "@/components/question-form"
import { Progress } from "@/components/ui/progress"

export default function SectionPage() {
  const params = useParams()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [section, setSection] = useState<Section | null>(null)
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"questions" | "help">("questions")

  // パラメータの取得と変換を明示的に行う
  const assessmentId = params.id as string
  const rawSectionId = params.sectionId as string

  // セクションIDを数値に変換
  const sectionId = Number.parseInt(rawSectionId, 10)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // セクションIDが有効かチェック
        if (isNaN(sectionId)) {
          throw new Error(`無効なセクションID: ${rawSectionId}`)
        }

        // 評価データを取得
        const assessment = await getAssessmentById(assessmentId)
        if (assessment) {
          setAssessmentData(assessment)
        }

        // セクション情報を取得
        const sectionData = await getSectionById(sectionId)
        if (!sectionData) {
          console.warn(`セクションID ${sectionId} が見つかりません`)
        }
        setSection(sectionData)

        // 質問を取得
        const questionsData = await getQuestionsForSection(sectionId)
        console.log(`取得した質問:`, questionsData)
        setQuestions(questionsData || [])

        // 回答を取得
        try {
          const answersData = await getAnswersForSection(assessmentId, sectionId)

          // Supabaseから取得した回答
          let combinedAnswers = [...answersData]

          // ローカルストレージからも回答を取得
          const localAnswers = getAnswersFromLocalStorage(assessmentId, sectionId)

          if (localAnswers && localAnswers.length > 0) {
            console.log(`ローカルストレージから ${localAnswers.length} 件の回答を取得しました`)

            // 既存の回答とローカルの回答をマージ
            // 同じquestion_idの回答はローカルの方を優先
            const questionIds = new Set(combinedAnswers.map((a) => a.question_id))

            for (const localAnswer of localAnswers) {
              if (questionIds.has(localAnswer.question_id)) {
                // 既存の回答を更新
                combinedAnswers = combinedAnswers.map((a) =>
                  a.question_id === localAnswer.question_id ? localAnswer : a,
                )
              } else {
                // 新しい回答を追加
                combinedAnswers.push(localAnswer)
              }
            }
          }

          setAnswers(combinedAnswers || [])
        } catch (answerErr) {
          console.warn("回答データの取得中に警告:", answerErr)

          // Supabaseからの取得に失敗した場合、ローカルストレージから取得を試みる
          const localAnswers = getAnswersFromLocalStorage(assessmentId, sectionId)
          if (localAnswers && localAnswers.length > 0) {
            console.log(`ローカルストレージから ${localAnswers.length} 件の回答を取得しました`)
            setAnswers(localAnswers)
          } else {
            // 回答が見つからない場合は空の配列を設定
            setAnswers([])
          }
        }
      } catch (err) {
        console.error("データ読み込みエラー:", err)
        setError(`データの読み込み中にエラーが発生しました: ${err.message || "不明なエラー"}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [assessmentId, sectionId, rawSectionId])

  const handleSaved = () => {
    // 保存完了後の処理
    router.push(`/assessment/${assessmentId}`)
  }

  // 回答率を計算
  const calculateResponseRate = () => {
    if (!questions || questions.length === 0) return 0
    const answeredQuestions = answers.length
    return Math.round((answeredQuestions / questions.length) * 100)
  }

  const responseRate = calculateResponseRate()

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 max-w-7xl mx-auto w-full">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">エラーが発生しました</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={() => router.push(`/assessment/${assessmentId}`)} className="mt-2">
              評価ページに戻る
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" className="flex items-center gap-2" disabled>
              <ArrowLeft className="h-4 w-4" />
              評価ページに戻る
            </Button>
            <Skeleton className="h-8 w-40" />
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/assessment/${assessmentId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            評価ページに戻る
          </Button>
          <div className="flex flex-col items-end">
            <h1 className="text-xl font-bold text-gray-800">{assessmentData?.name || `評価 ${assessmentId}`}</h1>
            <div className="text-sm text-gray-500">回答率: {responseRate}%</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{section?.name || `セクション ${sectionId}`}</h2>
            </div>
            {section?.description && <p className="text-gray-600 mt-2">{section.description}</p>}
            <Progress value={responseRate} className="h-2 mt-4" />
          </div>

          <div className="p-6">
            <div className="flex border-b mb-6">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "questions"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("questions")}
              >
                質問回答
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "help"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("help")}
              >
                ヘルプ
              </button>
            </div>

            {activeTab === "questions" ? (
              <QuestionForm
                questions={questions}
                sectionId={sectionId}
                assessmentId={assessmentId}
                datacenterName={assessmentData?.name || "未設定のデータセンター"}
                existingAnswers={answers}
                onSaved={handleSaved}
              />
            ) : (
              <div className="bg-blue-50 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-3">
                  <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">回答方法について</h3>
                    <p className="text-gray-700 mb-3">
                      このセクションでは、データセンターの{section?.name || ""}に関する質問に回答してください。
                    </p>
                    <ul className="space-y-2 text-gray-700 list-disc pl-5">
                      <li>各質問に対して適切な回答を選択または入力してください。</li>
                      <li>
                        すべての質問に回答する必要はありませんが、より正確な評価のためにできるだけ多くの質問に回答することをお勧めします。
                      </li>
                      <li>回答を保存すると、自動的に評価ページに戻ります。</li>
                      <li>後で回答を変更することもできます。</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <EvaluationCriteriaSection />
    </div>
  )
}

