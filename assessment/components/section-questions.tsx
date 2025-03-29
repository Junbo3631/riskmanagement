"use client"

import type React from "react"
import QuestionForm from "./question-form"

interface Question {
  id: string
  text: string
  type: string
  options?: string[] | string | { [key: string]: string }
}

interface SectionQuestionsProps {
  questions: Question[]
  answers: { [key: string]: any }
  handleAnswerChange: (questionId: string, value: any) => void
}

// オプションが配列形式であることを確認する関数
const ensureOptionsArray = (question: Question): Question => {
  if (!question.options) return question

  let options = question.options

  // 文字列の場合はJSONとしてパースを試みる
  if (typeof options === "string") {
    try {
      options = JSON.parse(options)
    } catch (e) {
      console.error(`質問ID ${question.id} のオプション解析に失敗しました:`, e)
      options = []
    }
  }

  // オブジェクトの場合は配列に変換
  if (!Array.isArray(options) && typeof options === "object" && options !== null) {
    options = Object.values(options)
  }

  // 配列でない場合は空配列にする
  if (!Array.isArray(options)) {
    console.warn(`質問ID ${question.id} のオプションが配列ではありません:`, options)
    options = []
  }

  return { ...question, options }
}

const SectionQuestions: React.FC<SectionQuestionsProps> = ({ questions, answers, handleAnswerChange }) => {
  // 質問データを処理
  const processedQuestions = questions.map(ensureOptionsArray)

  return (
    <div>
      {processedQuestions.map((question) => (
        <QuestionForm
          key={question.id}
          question={question}
          answer={answers[question.id]}
          onChange={(value) => handleAnswerChange(question.id, value)}
        />
      ))}
    </div>
  )
}

export default SectionQuestions

