"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MoreHorizontal, AlertTriangle, CheckCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface FacilityCardProps {
  facility: {
    id: string
    name: string
    location: string
    risk_level?: string
    progress: number
    updated_at: string
  }
  onDelete?: (id: string) => void
}

export function FacilityCard({ facility, onDelete }: FacilityCardProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "今日"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "昨日"
    } else {
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // メニューボタンがクリックされた場合は、カードのクリックイベントを無視
    if ((e.target as HTMLElement).closest(".menu-button")) {
      return
    }
    router.push(`/assessment/${facility.id}`)
  }

  const getRiskBadge = () => {
    if (!facility.risk_level) return null

    if (facility.risk_level === "高リスク") {
      return (
        <Badge variant="destructive" className="text-white">
          高リスク
        </Badge>
      )
    } else if (facility.risk_level === "中リスク") {
      return (
        <Badge variant="warning" className="bg-yellow-500 text-white">
          中リスク
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-green-500 text-white">
          完了
        </Badge>
      )
    }
  }

  const getStatusIcon = () => {
    if (facility.progress === 100) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else {
      return <AlertTriangle className="h-5 w-5 text-amber-500" />
    }
  }

  return (
    <Card
      className="mb-4 cursor-pointer overflow-hidden bg-blue-800 hover:bg-blue-700 transition-colors"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            {getStatusIcon()}
            <div>
              <h3 className="font-medium text-white">{facility.name}</h3>
              <p className="text-sm text-gray-200">{facility.location}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getRiskBadge()}
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded-full hover:bg-blue-700 focus:outline-none menu-button"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-200" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/assessment/${facility.id}`)}>
                  詳細を表示
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/assessment/${facility.id}/edit`)}>編集</DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(facility.id)
                    }}
                  >
                    削除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-200">進捗 ({facility.progress}%)</span>
            <span className="text-gray-200">更新: {formatDate(facility.updated_at)}</span>
          </div>
          <Progress value={facility.progress} className="h-2 bg-blue-900" indicatorClassName="bg-blue-400" />
        </div>
      </CardContent>
    </Card>
  )
}

