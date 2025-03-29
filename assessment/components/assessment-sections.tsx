import Link from "next/link"
import { getAllSections } from "@/lib/assessment-service"

interface AssessmentSectionsProps {
  assessmentId: string
}

export async function AssessmentSections({ assessmentId }: AssessmentSectionsProps) {
  const sections = await getAllSections()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((section) => (
        <Link
          key={section.id}
          href={`/assessment/${assessmentId}/section/${section.id}`}
          className="block bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="text-xl font-semibold">{section.title}</h3>
          <p className="text-gray-600 mt-2">{section.description}</p>
          <div className="mt-4">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              セクション {section.id}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

