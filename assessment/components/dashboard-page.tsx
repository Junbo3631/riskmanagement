"use client"

import { useState } from "react"
import { SectionSelector } from "./section-selector"
import { QuestionForm } from "./question-form"
import { RiskScoreDisplay } from "./risk-score-display"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface DashboardPageProps {
  assessmentId: string
  assessment: any
}

export function DashboardPage({ assessmentId, assessment }: DashboardPageProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  // セクションが選択されていない場合はセクション選択画面を表示
  if (!selectedSection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{assessment.name}</h1>
            <p className="text-muted-foreground">{assessment.location}</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <RiskScoreDisplay assessment={assessment} />
          <SectionSelector
            assessmentId={assessmentId}
            assessment={assessment}
            onSectionSelect={(sectionId) => setSelectedSection(sectionId)}
          />
        </div>
      </div>
    )
  }

  // セクションが選択されている場合は質問フォームを表示
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{assessment.name}</h1>
          <p className="text-muted-foreground">{assessment.location}</p>
        </div>
        <Button variant="outline" onClick={() => setSelectedSection(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          セクション選択に戻る
        </Button>
      </div>

      <QuestionForm
        assessmentId={assessmentId}
        sectionId={selectedSection}
        initialAnswers={assessment.answers[selectedSection] || {}}
        onComplete={() => setSelectedSection(null)}
      />
    </div>
  )
}

