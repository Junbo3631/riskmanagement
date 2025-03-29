"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import QuestionForm from "./question-form"
import {
  fetchSections,
  getQuestionsForSection,
  getAnswersForSection,
  updateAssessmentProgress,
  getSectionById,
  saveSectionAnswersToSupabase, // Import the missing function
} from "@/lib/assessment-service"
import type { Section, Question, Answer } from "@/types"

interface SectionManagerProps {
  assessmentId: string
  datacenterName: string
  onComplete?: () => void
  initialSectionId?: number
}

// オプションを配列形式に変換する関数
function ensureOptionsArray(options: any): any[] {
  if (!options) return []

  // すでに配列の場合はそのまま返す
  if (Array.isArray(options)) return options

  // オブジェクトの場合は配列に変換
  if (typeof options === "object" && options !== null) {
    return Object.values(options)
  }

  // 文字列の場合はJSONとしてパースを試みる
  if (typeof options === "string") {
    try {
      const parsedOptions = JSON.parse(options)
      if (Array.isArray(parsedOptions)) {
        return parsedOptions
      } else if (typeof parsedOptions === "object" && parsedOptions !== null) {
        return Object.values(parsedOptions)
      }
    } catch (e) {
      console.error(`オプションの解析に失敗しました: ${options}`, e)
    }
  }

  console.warn(`不明なオプション形式: ${typeof options}`, options)
  return []
}

export default function SectionManager({
  assessmentId,
  datacenterName,
  onComplete,
  initialSectionId = 1,
}: SectionManagerProps) {
  const { toast } = useToast()
  const [sections, setSections] = useState<Section[]>([])
  const [currentSectionId, setCurrentSectionId] = useState<number>(initialSectionId)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [progress, setProgress] = useState<number>(0)
  const [currentSection, setCurrentSection] = useState<Section | null>(null)

  // コンポーネントがマウントされたときに一度だけ実行
  useEffect(() => {
    console.log("SectionManager: コンポーネントがマウントされました")
    console.log("SectionManager: 評価ID:", assessmentId)
    console.log("SectionManager: データセンター名:", datacenterName)
    console.log("SectionManager: 初期セクションID:", initialSectionId)

    // セクション一覧を取得
    loadSections()

    // クリーンアップ関数
    return () => {
      console.log("SectionManager: コンポーネントがアンマウントされました")
    }
  }, []) // 空の依存配列で一度だけ実行

  // 現在のセクションIDが変更されたときに実行
  useEffect(() => {
    if (currentSectionId) {
      console.log(`SectionManager: セクションID ${currentSectionId} に変更されました`)
      loadSectionData(currentSectionId)
    }
  }, [currentSectionId]) // currentSectionIdが変更されたときに実行

  // セクション一覧を取得する関数
  const loadSections = async () => {
    try {
      console.log("SectionManager: セクション一覧を取得します")
      setLoading(true)

      const sectionsData = await fetchSections()
      console.log("SectionManager: 取得したセクション一覧:", sectionsData)

      if (sectionsData && sectionsData.length > 0) {
        setSections(sectionsData)

        // 初期セクションIDが指定されている場合は、そのセクションを選択
        if (initialSectionId) {
          console.log(`SectionManager: 初期セクションID ${initialSectionId} を選択します`)
          setCurrentSectionId(initialSectionId)
        } else {
          // 指定がない場合は最初のセクションを選択
          console.log("SectionManager: 初期セクションIDが指定されていないため、最初のセクションを選択します")
          setCurrentSectionId(sectionsData[0].id)
        }
      } else {
        console.warn("SectionManager: セクションデータが空です")
        toast({
          title: "セクションが見つかりません",
          description: "データベースにセクションが登録されていません。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("SectionManager: セクション一覧取得エラー:", error)
      toast({
        title: "エラーが発生しました",
        description: "セクション一覧の取得中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 特定のセクションのデータを取得する関数
  const loadSectionData = async (sectionId: number) => {
    try {
      console.log(`SectionManager: セクションID ${sectionId} のデータを取得します`)
      setLoading(true)

      // セクション情報を取得
      const sectionData = await getSectionById(sectionId)
      console.log(`SectionManager: セクションID ${sectionId} の情報:`, sectionData)
      setCurrentSection(sectionData)

      // 質問データを取得
      const questionsData = await getQuestionsForSection(sectionId)
      console.log(`SectionManager: セクションID ${sectionId} の質問データ:`, questionsData)

      // 質問データのオプションを処理
      const processedQuestionsData = questionsData.map((question) => {
        // 特に問題のある質問IDを重点的に確認
        if (question.id >= 2001 && question.id <= 2020) {
          console.log(`質問ID ${question.id} のオプション処理前:`, {
            type: typeof question.options,
            isArray: Array.isArray(question.options),
            value: question.options,
          })

          // オプションを配列形式に変換
          question.options = ensureOptionsArray(question.options)

          console.log(`質問ID ${question.id} のオプション処理後:`, {
            isArray: Array.isArray(question.options),
            value: question.options,
          })
        }
        return question
      })

      setQuestions(processedQuestionsData)

      // 回答データを取得
      const answersData = await getAnswersForSection(assessmentId, sectionId)
      console.log(`SectionManager: セクションID ${sectionId} の回答データ:`, answersData)
      setAnswers(answersData)

      // 進捗状況を更新
      try {
        const progressValue = await updateAssessmentProgress(assessmentId)
        console.log(`SectionManager: 進捗状況を更新しました: ${progressValue}%`)
        setProgress(progressValue)
      } catch (progressError) {
        console.error("SectionManager: 進捗状況の更新に失敗しました:", progressError)
      }
    } catch (error) {
      console.error(`SectionManager: セクションID ${sectionId} のデータ取得エラー:`, error)
      toast({
        title: "エラーが発生しました",
        description: `セクションデータの取得中にエラーが発生しました: ${error.message || "不明なエラー"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // セクションを変更する関数
  const changeSection = (sectionId: number) => {
    console.log(`SectionManager: セクションを ${sectionId} に変更します`)
    setCurrentSectionId(sectionId)
  }

  // 次のセクションに進む関数
  const goToNextSection = () => {
    console.log("SectionManager: 次のセクションに進みます")
    const currentIndex = sections.findIndex((section) => section.id === currentSectionId)
    if (currentIndex < sections.length - 1) {
      const nextSectionId = sections[currentIndex + 1].id
      console.log(`SectionManager: 次のセクションID: ${nextSectionId}`)
      setCurrentSectionId(nextSectionId)
    } else {
      console.log("SectionManager: 最後のセクションです。完了処理を実行します。")
      if (onComplete) {
        onComplete()
      }
    }
  }

  // 前のセクションに戻る関数
  const goToPreviousSection = () => {
    console.log("SectionManager: 前のセクションに戻ります")
    const currentIndex = sections.findIndex((section) => section.id === currentSectionId)
    if (currentIndex > 0) {
      const prevSectionId = sections[currentIndex - 1].id
      console.log(`SectionManager: 前のセクションID: ${prevSectionId}`)
      setCurrentSectionId(prevSectionId)
    } else {
      console.log("SectionManager: 最初のセクションです")
      toast({
        title: "最初のセクションです",
        description: "これ以上前のセクションはありません。",
      })
    }
  }

  // 全てのセクションを更新する関数
  const updateAllSections = async () => {
    console.log("SectionManager: 全てのセクションを更新します")
    try {
      setLoading(true)
      toast({
        title: "更新中...",
        description: "全てのセクションを更新しています。しばらくお待ちください。",
      })

      // 各セクションを順番に処理
      for (const section of sections) {
        console.log(`SectionManager: セクションID ${section.id} を処理します`)

        // セクションの質問を取得
        const sectionQuestions = await getQuestionsForSection(section.id)

        // セクションの回答を取得
        const sectionAnswers = await getAnswersForSection(assessmentId, section.id)

        // 回答がない場合は、空の回答を作成
        if (sectionAnswers.length === 0 && sectionQuestions.length > 0) {
          console.log(`SectionManager: セクションID ${section.id} の回答がありません。空の回答を作成します。`)

          // 質問ごとに空の回答を作成
          const emptyAnswers = sectionQuestions.map((question) => ({
            assessment_id: assessmentId,
            question_id: question.id,
            section_id: section.id,
            selected_options: [],
            datacenter_name: datacenterName,
          }))

          // 空の回答を保存
          // 注意: 既存の回答を削除せずに追加するだけなので、外部キー制約違反は発生しない
          try {
            await saveSectionAnswersToSupabase(assessmentId, section.id, emptyAnswers, datacenterName)
            console.log(`SectionManager: セクションID ${section.id} の空の回答を保存しました。`)
          } catch (saveError) {
            console.error(`SectionManager: セクションID ${section.id} の回答保存エラー:`, saveError)
          }
        }
      }

      // 進捗状況を更新
      const progressValue = await updateAssessmentProgress(assessmentId)
      console.log(`SectionManager: 進捗状況を更新しました: ${progressValue}%`)
      setProgress(progressValue)

      toast({
        title: "更新完了",
        description: "全てのセクションの更新が完了しました。",
      })
    } catch (error) {
      console.error("SectionManager: 全セクション更新エラー:", error)
      toast({
        title: "エラーが発生しました",
        description: `全セクションの更新中にエラーが発生しました: ${error.message || "不明なエラー"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 読み込み中の表示
  if (loading && sections.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>読み込み中...</CardTitle>
          <CardDescription>セクションデータを読み込んでいます。しばらくお待ちください。</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={30} className="w-full" />
        </CardContent>
      </Card>
    )
  }

  // セクションが存在しない場合のメッセージ
  if (!sections || sections.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>セクションが見つかりません</CardTitle>
          <CardDescription>データベースにセクションが登録されていません。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
            <p>管理者に連絡して、セクションを登録してもらうか、データベースの接続設定を確認してください。</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={loadSections}>再読み込み</Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">リスク評価セクション</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">進捗状況: {progress}%</span>
          <Progress value={progress} className="w-24" />
        </div>
      </div>

      <Tabs
        defaultValue={currentSectionId.toString()}
        value={currentSectionId.toString()}
        onValueChange={(value) => changeSection(Number(value))}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-4">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id.toString()}>
              {section.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id.toString()}>
            <Card>
              <CardHeader>
                <CardTitle>{section.name}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="p-4 text-center">
                    <p>読み込み中...</p>
                    <Progress value={30} className="w-full mt-2" />
                  </div>
                ) : (
                  <QuestionForm
                    questions={questions}
                    sectionId={currentSectionId}
                    assessmentId={assessmentId}
                    datacenterName={datacenterName}
                    existingAnswers={answers}
                    onComplete={goToNextSection}
                    debug={false}
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goToPreviousSection} disabled={loading}>
                  前のセクション
                </Button>
                <Button variant="outline" onClick={updateAllSections} disabled={loading}>
                  全セクション更新
                </Button>
                <Button onClick={goToNextSection} disabled={loading}>
                  次のセクション
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

