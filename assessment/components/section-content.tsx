"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { QuestionForm } from "@/components/question-form"
import { getSectionTitle } from "@/lib/questions"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Question, Answer } from "@/types"

interface SectionContentProps {
  assessmentId: string
  sectionId: number
  questions: Question[]
  existingAnswers: Answer[]
  datacenterName: string
}

export function SectionContent({
  assessmentId,
  sectionId,
  questions,
  existingAnswers,
  datacenterName,
}: SectionContentProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  const sectionTitle = getSectionTitle(sectionId)
  const totalSections = 7 // 合計セクション数

  const handleSaved = () => {
    setSaved(true)
  }

  const navigateToPreviousSection = () => {
    if (sectionId > 1) {
      router.push(`/assessment/${assessmentId}/section/${sectionId - 1}`)
    } else {
      router.push(`/assessment/${assessmentId}`)
    }
  }

  const navigateToNextSection = () => {
    if (sectionId < totalSections) {
      router.push(`/assessment/${assessmentId}/section/${sectionId + 1}`)
    } else {
      router.push(`/assessment/${assessmentId}`)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{sectionTitle}</h1>
        <div className="text-sm text-gray-500">
          セクション {sectionId} / {totalSections}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <QuestionForm
          questions={questions}
          assessmentId={assessmentId}
          sectionId={sectionId}
          datacenterName={datacenterName}
          existingAnswers={existingAnswers}
          onSaved={handleSaved}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={navigateToPreviousSection} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          前のセクション
        </Button>

        <Button onClick={navigateToNextSection} className="flex items-center gap-2">
          次のセクション
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

