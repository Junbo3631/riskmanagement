import { getAllSections, getAnswersForFacility } from "@/lib/assessment-service"
import { calculateSectionProgress } from "@/lib/progress-calculator"

interface SectionProgressProps {
  assessmentId: string
}

export async function SectionProgress({ assessmentId }: SectionProgressProps) {
  const sections = await getAllSections()
  const answers = await getAnswersForFacility(assessmentId)

  // セクションごとの進捗率を計算
  const sectionProgress = calculateSectionProgress(sections, answers)

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const progress = sectionProgress[section.id] || 0

        return (
          <div key={section.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

