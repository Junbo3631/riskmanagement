"use client"

import { useState, useEffect } from "react"
import type { Section } from "@/types/risk-assessment"
import { getSections } from "@/services/risk-assessment-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SectionsListProps {
  onSelectSection: (section: Section) => void
  selectedSectionId?: string
}

export default function SectionsList({ onSelectSection, selectedSectionId }: SectionsListProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSections() {
      try {
        setLoading(true)
        const data = await getSections()
        setSections(data)
      } catch (err) {
        setError("セクションの読み込み中にエラーが発生しました")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadSections()
  }, [])

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>評価セクション</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sections.length === 0 ? (
            <p>セクションがありません</p>
          ) : (
            sections.map((section) => (
              <Button
                key={section.id}
                variant={selectedSectionId === section.id ? "default" : "outline"}
                className="w-full justify-start text-left"
                onClick={() => onSelectSection(section)}
              >
                {section.name}
              </Button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

