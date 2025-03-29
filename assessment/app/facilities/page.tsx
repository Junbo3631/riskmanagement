"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase-client"
import type { Facility } from "@/types/risk-assessment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFacilities() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("facilities").select("*").order("name")

        if (error) throw error

        setFacilities(data as Facility[])
      } catch (err) {
        setError("データセンター情報の読み込み中にエラーが発生しました")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadFacilities()
  }, [])

  if (loading) {
    return <div className="container mx-auto py-8 text-center">読み込み中...</div>
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">データセンター一覧</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.length === 0 ? (
          <p>データセンターがありません</p>
        ) : (
          facilities.map((facility) => (
            <Card key={facility.id}>
              <CardHeader>
                <CardTitle>{facility.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/risk-assessment/${facility.id}`}>
                  <Button className="w-full">リスク評価を表示</Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

