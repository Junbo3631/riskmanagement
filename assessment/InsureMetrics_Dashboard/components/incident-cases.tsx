"use client"

import type { IncidentCase } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"

interface IncidentCasesProps {
  incidents: IncidentCase[]
  riskLevel: string
}

export function IncidentCases({ incidents, riskLevel }: IncidentCasesProps) {
  // リスクレベルに応じたタイトルを取得
  const getRiskLevelTitle = (level: string) => {
    switch (level) {
      case "low":
        return "低リスク (1.0未満)"
      case "medium":
        return "中リスク (1.0〜2.0)"
      case "high":
        return "高リスク (2.0以上)"
      default:
        return "すべてのリスク"
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">事故事例 - {getRiskLevelTitle(riskLevel)}</h2>
      {incidents.length === 0 ? (
        <p className="text-gray-500">該当する事故事例はありません。</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>事故発生日</TableHead>
                <TableHead>施設名</TableHead>
                <TableHead>リスク評価項目</TableHead>
                <TableHead>事故概要</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>影響</TableHead>
                <TableHead>深刻度</TableHead>
                <TableHead>保険請求</TableHead>
                <TableHead>請求金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.incident_id}>
                  <TableCell>{formatDate(incident.incident_date)}</TableCell>
                  <TableCell>{incident.facility_name}</TableCell>
                  <TableCell>{incident.risk_category}</TableCell>
                  <TableCell>{incident.incident_summary}</TableCell>
                  <TableCell>{incident.cause}</TableCell>
                  <TableCell>{incident.impact}</TableCell>
                  <TableCell>{incident.incident_severity.toFixed(1)}</TableCell>
                  <TableCell>{incident.insurance_claimed ? "あり" : "なし"}</TableCell>
                  <TableCell>
                    {incident.insurance_amount ? `¥${incident.insurance_amount.toLocaleString()}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

