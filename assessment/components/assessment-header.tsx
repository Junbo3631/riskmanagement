import { formatDate } from "@/lib/utils"
import type { AssessmentData } from "@/lib/assessment-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

interface AssessmentHeaderProps {
  assessment: AssessmentData
}

export function AssessmentHeader({ assessment }: AssessmentHeaderProps) {
  const { id, name, location, assessor, date, progress, riskScore } = assessment

  // リスクレベルに応じた色を設定
  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <Link href="/assessment" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            評価一覧に戻る
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Link href={`/assessment/${id}/report`}>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              レポート表示
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div>
          <p className="text-sm text-gray-500">場所</p>
          <p className="font-medium">{location}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">評価者</p>
          <p className="font-medium">{assessor}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">評価日</p>
          <p className="font-medium">{formatDate(date)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">進捗状況</p>
          <p className="font-medium">{progress}% 完了</p>
        </div>
      </div>

      {riskScore && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-gray-500 mr-2">リスク評価:</p>
            <Badge className={getRiskLevelColor(riskScore.riskLevel)}>
              {riskScore.riskLevel === "low"
                ? "低"
                : riskScore.riskLevel === "medium"
                  ? "中"
                  : riskScore.riskLevel === "high"
                    ? "高"
                    : riskScore.riskLevel === "critical"
                      ? "重大"
                      : "未評価"}
            </Badge>
            <p className="text-sm ml-4">
              <span className="text-gray-500">スコア:</span>{" "}
              <span className="font-medium">{riskScore.totalScore.toFixed(1)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

