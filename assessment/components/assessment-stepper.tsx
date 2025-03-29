"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, ListChecks } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { allSections } from "@/lib/questions"
import { saveSectionAnswersToSupabase, updateAssessmentProgress } from "@/lib/assessment-service"
import { calculateSectionProgress, calculateStepperProgress } from "@/lib/progress-calculator"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface AssessmentStepperProps {
  assessmentId: string
  sectionId: string
  initialAnswers?: Record<string, any>
  onComplete?: (sectionId: string, answers: Record<string, any>) => void
  onBackToSelector?: () => void
  onProgressUpdate?: () => void
}

export function AssessmentStepper({
  assessmentId,
  sectionId,
  initialAnswers = {},
  onComplete,
  onBackToSelector,
  onProgressUpdate,
}: AssessmentStepperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [sectionProgress, setSectionProgress] = useState({
    progress: 0,
    completedQuestions: 0,
    totalRequiredQuestions: 0,
  })
  const { toast } = useToast()

  // 保存処理中かどうかを追跡するref
  const isSavingRef = useRef(false)
  // 現在のステップを追跡するref
  const currentStepRef = useRef(currentStep)
  // コンポーネントがマウントされているかを追跡するref
  const isMountedRef = useRef(true)

  // currentStepRefを更新
  useEffect(() => {
    currentStepRef.current = currentStep
  }, [currentStep])

  // セクションの質問を取得
  const section = allSections[sectionId as keyof typeof allSections]

  // 質問の総数と必須質問の数を取得
  const { totalQuestions, requiredQuestions } = calculateStepperProgress(sectionId)

  useEffect(() => {
    // コンポーネントがマウントされたことを記録
    isMountedRef.current = true

    // コンポーネントがマウントされたときにエラーをクリア
    setErrorMessage(null)

    // 初期回答をセット
    if (initialAnswers) {
      setAnswers(initialAnswers)
      console.log(`初期回答をセットしました (${sectionId}):`, initialAnswers)

      // セクションの進捗状況を計算
      const progress = calculateSectionProgress(initialAnswers, sectionId)
      setSectionProgress(progress)
    }

    // コンポーネントのアンマウント時に保存中のフラグをリセット
    return () => {
      isMountedRef.current = false
      isSavingRef.current = false
    }
  }, [initialAnswers, sectionId])

  // セクションが存在しない場合
  if (!section) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>エラー</CardTitle>
          <CardDescription>このセクションは存在しません</CardDescription>
        </CardHeader>
        <CardContent>
          <p>指定されたセクションID: {sectionId}</p>
        </CardContent>
      </Card>
    )
  }

  // 質問が存在しない場合
  if (!section.questions || Object.keys(section.questions).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>エラー</CardTitle>
          <CardDescription>このセクションの質問はまだ準備されていません</CardDescription>
        </CardHeader>
        <CardContent>
          <p>セクション: {section.title}</p>
        </CardContent>
      </Card>
    )
  }

  // 質問のIDの配列
  const questionIds = Object.keys(section.questions)

  // 現在の質問
  const currentQuestion = section.questions[questionIds[currentStep]]

  // 回答を更新する関数
  const updateAnswer = (value: any) => {
    if (!isMountedRef.current) return

    console.log(`回答を更新: ${currentQuestion.id} = `, value)

    // 回答を更新
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [currentQuestion.id]: value,
      }

      // セクションの進捗状況を再計算
      const progress = calculateSectionProgress(newAnswers, sectionId)
      setSectionProgress(progress)

      return newAnswers
    })
  }

  // 回答を保存する関数 - 非同期処理を適切に処理
  const saveCurrentAnswers = async (): Promise<boolean> => {
    // コンポーネントがアンマウントされていたら処理をスキップ
    if (!isMountedRef.current) return true

    // 既に保存中の場合は処理をスキップ
    if (isSavingRef.current) {
      console.log("既に保存処理中のため、スキップします")
      return true
    }

    isSavingRef.current = true
    setIsSaving(true)

    try {
      console.log(`回答を保存します (${sectionId}):`, answers)
      console.log(`セクションID: ${sectionId}, 質問数: ${Object.keys(answers).length}`)

      // 質問IDとセクションIDの関係をログに出力
      Object.keys(answers).forEach((questionId) => {
        console.log(`質問ID: ${questionId} -> セクションID: ${sectionId}`)
      })

      // Supabaseに回答を保存
      await saveSectionAnswersToSupabase(assessmentId, sectionId, answers)
      console.log(`回答を保存しました (${sectionId})`)

      setErrorMessage(null)

      // 進捗状況を更新
      if (onProgressUpdate) {
        try {
          await onProgressUpdate()
        } catch (progressError) {
          console.error("進捗状況の更新中にエラーが発生しましたが、処理を続行します:", progressError)
        }
      }

      // 保存成功をトーストで通知
      toast({
        title: "保存完了",
        description: "回答が保存されました",
      })

      return true
    } catch (err) {
      // エラーメッセージを設定
      const message = err instanceof Error ? err.message : "回答の保存に失敗しました"
      console.error("回答の保存に失敗しました:", message)

      if (isMountedRef.current) {
        setErrorMessage(message)

        // エラーをトーストで通知
        toast({
          title: "保存エラー",
          description: message,
          variant: "destructive",
        })
      }

      // エラーが発生しても処理を続行するためにtrueを返す
      return true
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false)
      }
      isSavingRef.current = false
    }
  }

  // 次のステップに進む - 非同期処理を適切に処理
  const handleNext = async () => {
    // コンポーネントがアンマウントされていたら処理をスキップ
    if (!isMountedRef.current) return

    // 既に保存中の場合は処理をスキップ
    if (isSavingRef.current) {
      console.log("既に保存処理中のため、スキップします")
      return
    }

    // 必須項目のチェック
    if (currentQuestion.required && !answers[currentQuestion.id]) {
      setErrorMessage("この質問は必須です")

      // エラーをトーストで通知
      toast({
        title: "入力エラー",
        description: "この質問は必須です。回答を入力してください。",
        variant: "destructive",
      })

      return
    }

    setErrorMessage(null)
    console.log(`「次へ」ボタンがクリックされました。現在のステップ: ${currentStep}/${questionIds.length - 1}`)
    console.log("現在の質問ID:", currentQuestion.id)
    console.log("現在の回答:", answers[currentQuestion.id])

    try {
      // 保存中フラグを設定
      isSavingRef.current = true
      setIsSaving(true)

      // 回答を保存
      console.log("回答の保存を開始します...")

      try {
        // Supabaseに回答を保存
        await saveSectionAnswersToSupabase(assessmentId, sectionId, answers)
        console.log(`回答を保存しました (${sectionId})`)
      } catch (saveError) {
        console.error("回答の保存中にエラーが発生しましたが、処理を続行します:", saveError)
        // エラーが発生しても処理を続行
      }

      // 最後の質問の場合
      if (currentStepRef.current === questionIds.length - 1) {
        console.log("最後の質問です。セクション完了処理を実行します。")

        try {
          // 進捗状況を更新
          console.log("進捗状況の更新を開始します...")
          await updateAssessmentProgress(assessmentId)
          console.log("進捗状況の更新が完了しました")
        } catch (progressError) {
          console.error("進捗状況の更新中にエラーが発生しました:", progressError)
          // エラーが発生しても処理を続行
        }

        // 完了時のコールバックを呼び出す
        if (onComplete && isMountedRef.current) {
          console.log("onCompleteコールバックを呼び出します")
          onComplete(sectionId, answers)
        } else {
          console.log("onCompleteコールバックが定義されていません")
        }

        // 保存中フラグをリセット
        isSavingRef.current = false
        if (isMountedRef.current) {
          setIsSaving(false)
        }
        return
      }

      // 次のステップに進む - 直接次のステップ値を計算して設定
      const nextStep = currentStepRef.current + 1
      console.log(`次のステップに進みます: ${currentStepRef.current} → ${nextStep}`)

      // 状態を更新する前に、次の質問が存在することを確認
      if (nextStep < questionIds.length && isMountedRef.current) {
        setCurrentStep(nextStep)
        console.log(`ステップを更新しました: ${currentStepRef.current} → ${nextStep}`)
      } else {
        console.error("次のステップが範囲外です:", nextStep, "質問数:", questionIds.length)
      }
    } catch (error) {
      console.error("次のステップに進む際にエラーが発生しました:", error)

      if (isMountedRef.current) {
        // エラーをトーストで通知
        toast({
          title: "エラー",
          description: "処理中にエラーが発生しましたが、続行します。",
          variant: "destructive",
        })

        // エラーメッセージを設定
        setErrorMessage("処理中にエラーが発生しましたが、続行します。")

        // エラーが発生しても次のステップに進む
        const nextStep = currentStepRef.current + 1
        if (nextStep < questionIds.length) {
          setCurrentStep(nextStep)
        }
      }
    } finally {
      // 保存中フラグをリセット
      isSavingRef.current = false
      if (isMountedRef.current) {
        setIsSaving(false)
      }
    }
  }

  // 前のステップに戻る
  const handlePrev = async () => {
    // コンポーネントがアンマウントされていたら処理をスキップ
    if (!isMountedRef.current) return

    // 既に保存中の場合は処理をスキップ
    if (isSavingRef.current) {
      console.log("既に保存処理中のため、スキップします")
      return
    }

    setErrorMessage(null)
    console.log(`「戻る」ボタンがクリックされました。現在のステップ: ${currentStep}/${questionIds.length - 1}`)

    try {
      // 保存中フラグを設定
      isSavingRef.current = true
      setIsSaving(true)

      // 現在の回答を保存してから前のステップに戻る
      try {
        // Supabaseに回答を保存
        await saveSectionAnswersToSupabase(assessmentId, sectionId, answers)
        console.log(`回答を保存しました (${sectionId})`)
      } catch (saveError) {
        console.error("回答の保存中にエラーが発生しましたが、処理を続行します:", saveError)
        // エラーが発生しても処理を続行
      }

      // 保存に失敗した場合でも前のステップには戻れるようにする
      console.log(`前のステップに戻ります: ${currentStep} → ${Math.max(0, currentStep - 1)}`)
      if (isMountedRef.current) {
        setCurrentStep((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("前のステップに戻る際にエラーが発生しました:", error)
      // エラーが発生しても前のステップには戻れるようにする
      if (isMountedRef.current) {
        setCurrentStep((prev) => Math.max(0, prev - 1))
      }
    } finally {
      // 保存中フラグをリセット
      isSavingRef.current = false
      if (isMountedRef.current) {
        setIsSaving(false)
      }
    }
  }

  // 評価セクションの選択に戻る
  const handleBackToSelector = async () => {
    // コンポーネントがアンマウントされていたら処理をスキップ
    if (!isMountedRef.current) return

    // 既に保存中の場合は処理をスキップ
    if (isSavingRef.current) {
      console.log("既に保存処理中のため、スキップします")
      return
    }

    console.log("「セクション選択に戻る」ボタンがクリックされました")

    try {
      // 保存中フラグを設定
      isSavingRef.current = true
      setIsSaving(true)

      // 現在の回答を保存
      try {
        // Supabaseに回答を保存
        await saveSectionAnswersToSupabase(assessmentId, sectionId, answers)
        console.log(`回答を保存しました (${sectionId})`)
      } catch (saveError) {
        console.error("回答の保存中にエラーが発生しましたが、処理を続行します:", saveError)
        // エラーが発生しても処理を続行
      }

      // 評価セクションの選択に戻るコールバックを呼び出す
      if (onBackToSelector) {
        console.log("onBackToSelectorコールバックを呼び出します")
        onBackToSelector()
      } else {
        console.warn("onBackToSelectorコールバックが定義されていません")
      }
    } catch (error) {
      console.error("セクション選択に戻る際にエラーが発生しました:", error)

      // エラーが発生してもセクション選択に戻れるようにする
      if (onBackToSelector) {
        onBackToSelector()
      }
    } finally {
      // 保存中フラグをリセット
      isSavingRef.current = false
      if (isMountedRef.current) {
        setIsSaving(false)
      }
    }
  }

  // 質問のレンダリング
  const renderQuestion = () => {
    if (!currentQuestion) return null

    switch (currentQuestion.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <div className="space-y-2">
            <Label htmlFor={currentQuestion.id}>{currentQuestion.label}</Label>
            <Input
              id={currentQuestion.id}
              type={currentQuestion.type}
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
            />
          </div>
        )
      case "date":
        return (
          <div className="space-y-2">
            <Label htmlFor={currentQuestion.id}>{currentQuestion.label}</Label>
            <Input
              id={currentQuestion.id}
              type="date"
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => updateAnswer(e.target.value)}
            />
          </div>
        )
      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={currentQuestion.id}>{currentQuestion.label}</Label>
            <Input
              id={currentQuestion.id}
              type="number"
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => updateAnswer(e.target.value)}
              min={currentQuestion.min}
              max={currentQuestion.max}
              step={currentQuestion.step || 1}
            />
          </div>
        )
      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={currentQuestion.id}>{currentQuestion.label}</Label>
            <Textarea
              id={currentQuestion.id}
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={4}
            />
          </div>
        )
      case "select":
        return (
          <div className="space-y-4">
            <Label>{currentQuestion.label}</Label>
            <RadioGroup value={answers[currentQuestion.id] || ""} onValueChange={updateAnswer}>
              {currentQuestion.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                  <Label htmlFor={`${currentQuestion.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      case "multiselect":
        return (
          <div className="space-y-4">
            <Label>{currentQuestion.label}</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {currentQuestion.options?.map((option) => {
                // 現在の選択状態を確認
                const currentSelections = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : []
                const isSelected = currentSelections.includes(option.value)

                return (
                  <div key={option.value} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`${currentQuestion.id}-${option.value}`}
                      checked={isSelected}
                      onChange={() => {
                        // 選択状態を切り替え
                        const newSelections = isSelected
                          ? currentSelections.filter((v) => v !== option.value)
                          : [...currentSelections, option.value]
                        updateAnswer(newSelections)
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="font-normal text-sm">
                      {option.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-2">
            <Label>{currentQuestion.label}</Label>
            <p className="text-sm text-muted-foreground">未対応の質問タイプです</p>
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{section.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            質問: {currentStep + 1}/{totalQuestions} (必須: {sectionProgress.completedQuestions}/{requiredQuestions})
          </div>
        </div>
        <CardDescription>{section.description}</CardDescription>
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">セクション進捗</span>
            <span>{sectionProgress.progress}%</span>
          </div>
          <Progress value={sectionProgress.progress} className="h-1.5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            質問 {currentStep + 1} / {questionIds.length}
            {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
          </p>
        </div>
        {renderQuestion()}
        {errorMessage && <p className="mt-2 text-sm text-destructive">{errorMessage}</p>}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0 || isSaving}>
            戻る
          </Button>
          <Button type="button" variant="outline" onClick={handleBackToSelector} disabled={isSaving}>
            <ListChecks className="mr-2 h-4 w-4" />
            セクション選択に戻る
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleNext} disabled={isSaving}>
            {isSaving ? "保存中..." : currentStep === questionIds.length - 1 ? "完了" : "次へ"}
            {!isSaving && currentStep !== questionIds.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

