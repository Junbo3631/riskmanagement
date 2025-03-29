"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SectionCardProps {
  id: string
  title: string
  description: string
  status: string
  progress?: number
  onClick: (id: string) => void
}

export function SectionCard({ id, title, description, status, progress = 0, onClick }: SectionCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "完了":
        return <Badge className="bg-green-500 text-white">完了</Badge>
      case "進行中":
        return <Badge className="bg-blue-500 text-white">進行中</Badge>
      case "未着手":
      default:
        return (
          <Badge variant="outline" className="text-gray-500">
            未着手
          </Badge>
        )
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="blue"
          className="w-full text-white blue-button-text"
          onClick={() => onClick(id)}
          style={{ color: "white" }}
        >
          入力開始
        </Button>
      </CardFooter>
    </Card>
  )
}

