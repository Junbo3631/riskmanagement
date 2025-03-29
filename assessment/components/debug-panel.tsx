"use client"

import { useState } from "react"
import {
  checkAnswersForAssessment,
  checkQuestionsForAssessment,
  checkSectionsForAssessment,
  checkFacilityForAssessment,
  checkRiskScoreForAssessment,
} from "@/lib/debug-utils"

interface DebugPanelProps {
  assessmentId: string
}

export default function DebugPanel({ assessmentId }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("facility")

  const togglePanel = () => {
    setIsOpen(!isOpen)
  }

  const checkFacility = async () => {
    setIsLoading(true)
    try {
      const result = await checkFacilityForAssessment(assessmentId)
      setDebugData(result)
    } catch (error) {
      console.error("施設データのチェック中にエラーが発生しました:", error)
      setDebugData({ success: false, error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const checkAnswers = async () => {
    setIsLoading(true)
    try {
      const result = await checkAnswersForAssessment(assessmentId)
      setDebugData(result)
    } catch (error) {
      console.error("回答データのチェック中にエラーが発生しました:", error)
      setDebugData({ success: false, error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const checkQuestions = async () => {
    setIsLoading(true)
    try {
      const result = await checkQuestionsForAssessment(assessmentId)
      setDebugData(result)
    } catch (error) {
      console.error("質問データのチェック中にエラーが発生しました:", error)
      setDebugData({ success: false, error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const checkSections = async () => {
    setIsLoading(true)
    try {
      const result = await checkSectionsForAssessment(assessmentId)
      setDebugData(result)
    } catch (error) {
      console.error("セクションデータのチェック中にエラーが発生しました:", error)
      setDebugData({ success: false, error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const checkRiskScore = async () => {
    setIsLoading(true)
    try {
      const result = await checkRiskScoreForAssessment(assessmentId)
      setDebugData(result)
    } catch (error) {
      console.error("リスクスコアデータのチェック中にエラーが発生しました:", error)
      setDebugData({ success: false, error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    setDebugData(null)

    switch (tab) {
      case "facility":
        checkFacility()
        break
      case "answers":
        checkAnswers()
        break
      case "questions":
        checkQuestions()
        break
      case "sections":
        checkSections()
        break
      case "riskScore":
        checkRiskScore()
        break
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={togglePanel}
          className="bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg hover:bg-gray-700 transition-colors"
        >
          デバッグパネルを開く
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">デバッグパネル</h2>
          <button onClick={togglePanel} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${activeTab === "facility" ? "bg-blue-100 border-b-2 border-blue-500" : ""}`}
            onClick={() => handleTabClick("facility")}
          >
            施設データ
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "answers" ? "bg-blue-100 border-b-2 border-blue-500" : ""}`}
            onClick={() => handleTabClick("answers")}
          >
            回答データ
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "questions" ? "bg-blue-100 border-b-2 border-blue-500" : ""}`}
            onClick={() => handleTabClick("questions")}
          >
            質問データ
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "sections" ? "bg-blue-100 border-b-2 border-blue-500" : ""}`}
            onClick={() => handleTabClick("sections")}
          >
            セクションデータ
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "riskScore" ? "bg-blue-100 border-b-2 border-blue-500" : ""}`}
            onClick={() => handleTabClick("riskScore")}
          >
            リスクスコア
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : debugData ? (
            <div>
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    debugData.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {debugData.success ? "成功" : "エラー"}
                </span>
              </div>

              {debugData.message && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">{debugData.message}</div>
              )}

              {debugData.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-bold text-red-700">エラー:</h3>
                  <p className="text-red-700">{debugData.error}</p>
                </div>
              )}

              {debugData.data && (
                <div className="overflow-auto max-h-[50vh]">
                  <pre className="bg-gray-100 p-4 rounded-md text-sm">{JSON.stringify(debugData.data, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">データを読み込むにはタブを選択してください</div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={togglePanel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

