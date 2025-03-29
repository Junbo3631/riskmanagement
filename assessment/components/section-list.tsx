import Link from "next/link"
import type { Section } from "@/types"
import { Progress } from "@/components/ui/progress"

interface SectionListProps {
  assessmentId: string
  sections: Section[]
  sectionProgress: {
    sectionId: number
    title: string
    progress: number
  }[]
}

export function SectionList({ assessmentId, sections, sectionProgress }: SectionListProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {sections.map((section) => {
        // 該当セクションの進捗率を取得
        const progressData = sectionProgress.find((p) => p.sectionId === section.id)
        const progressValue = progressData ? progressData.progress : 0

        return (
          <Link
            key={section.id}
            href={`/assessment/${assessmentId}/section/${section.id}`}
            className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <span className="text-sm font-medium text-gray-500">{progressValue}% 完了</span>
            </div>
            <Progress value={progressValue} className="h-2 mb-3" />
            <p className="text-gray-600 text-sm">{section.description}</p>
          </Link>
        )
      })}
    </div>
  )
}

