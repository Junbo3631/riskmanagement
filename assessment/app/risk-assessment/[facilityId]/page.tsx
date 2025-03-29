"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import type { Section } from "@/types/risk-assessment"
import SectionsList from "@/components/sections-list"
import QuestionsForm from "@/components/questions-form"
import AssessmentProgress from "@/components/assessment-progress"
import DebugDataViewer from "@/components/debug-data-viewer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RiskAssessmentPage() {
  const params = useParams()
  const facilityId = params.facilityId as string
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // 実際の実装では、ユーザーIDを認証システムから取得する
  const userId = "00000000-0000-0000-0000-000000000000" // 仮のユーザーID

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">リスク評価</h1>
        <Link href="/debug">
          <Button variant="outline" size="sm">
            デバッグツール
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <AssessmentProgress facilityId={facilityId} sectionId={selectedSection?.id} userId={userId} />
        <div className="text-right mt-2">
          <button onClick={() => setShowDebug(!showDebug)} className="text-sm text-gray-500 hover:text-gray-700">
            {showDebug ? "デバッグ情報を隠す" : "デバッグ情報を表示"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <SectionsList onSelectSection={setSelectedSection} selectedSectionId={selectedSection?.id} />
        </div>

        <div className="md:col-span-3">
          {selectedSection ? (
            <QuestionsForm section={selectedSection} facilityId={facilityId} userId={userId} />
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p>左側のリストからセクションを選択してください</p>
            </div>
          )}
        </div>
      </div>

      {showDebug && <DebugDataViewer facilityId={facilityId} userId={userId} />}
    </div>
  )
}

