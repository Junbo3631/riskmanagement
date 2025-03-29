"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface RiskItem {
  questionId: string
  question: string
  answer: string | string[]
  riskScore: number
  recommendation: string
  originalRiskScore?: any // デバッグ用に元のリスクスコアも表示
}

interface CategoryRecommendations {
  highRiskItems: RiskItem[]
  mediumRiskItems: RiskItem[]
  generalRecommendation: string
}

interface RiskRecommendationsProps {
  probabilityRecommendations: CategoryRecommendations
  impactRecommendations: CategoryRecommendations
  mitigationRecommendations: CategoryRecommendations
  totalRiskRecommendations: CategoryRecommendations
}

export function RiskRecommendations({
  probabilityRecommendations,
  impactRecommendations,
  mitigationRecommendations,
  totalRiskRecommendations,
}: RiskRecommendationsProps) {
  const [activeTab, setActiveTab] = useState("total")

  // リスクスコアに基づいて色を決定する関数
  const getRiskScoreColor = (score: number) => {
    if (score >= 4) return "bg-red-500 text-white"
    if (score >= 3) return "bg-orange-500 text-white"
    if (score >= 2) return "bg-yellow-500"
    return "bg-green-500 text-white"
  }

  // リスク項目を表示するコンポーネント
  const RiskItemsList = ({ items, title }: { items: RiskItem[]; title: string }) => {
    if (items.length === 0) {
      return <p className="text-gray-500 italic">該当する項目はありません</p>
    }

    return (
      <div className="space-y-4 bg-white p-4 rounded-md border border-gray-200">
        <h3 className="font-semibold text-lg text-black">{title}</h3>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="hover:bg-gray-50 px-4 rounded-md">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="text-left text-black font-medium">{item.question}</span>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getRiskScoreColor(item.riskScore)}`}>
                      リスクスコア: {item.riskScore}
                      {item.originalRiskScore !== undefined && ` (元: ${item.originalRiskScore})`}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">回答: </span>
                    <span>{Array.isArray(item.answer) ? item.answer.join(", ") : item.answer}</span>
                  </div>
                  <div>
                    <span className="font-semibold">推奨事項: </span>
                    <span>{item.recommendation}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>リスク改善推奨事項</CardTitle>
        <CardDescription>リスク評価に基づいて、改善が推奨される項目と対策を表示しています。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="total">総合リスク</TabsTrigger>
            <TabsTrigger value="probability">発生確率</TabsTrigger>
            <TabsTrigger value="impact">影響度</TabsTrigger>
            <TabsTrigger value="mitigation">対策レベル</TabsTrigger>
          </TabsList>

          <TabsContent value="total" className="space-y-6">
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h3 className="text-black font-semibold">総合リスクに基づく改善推奨事項</h3>
              <p className="text-black mt-2">{totalRiskRecommendations.generalRecommendation}</p>
            </div>
            <RiskItemsList items={totalRiskRecommendations.highRiskItems} title="高リスク項目" />
            <RiskItemsList items={totalRiskRecommendations.mediumRiskItems} title="中リスク項目" />
          </TabsContent>

          <TabsContent value="probability" className="space-y-6">
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h3 className="text-black font-semibold">発生確率に基づく改善推奨事項</h3>
              <p className="text-black mt-2">{probabilityRecommendations.generalRecommendation}</p>
            </div>
            <RiskItemsList items={probabilityRecommendations.highRiskItems} title="高リスク項目" />
            <RiskItemsList items={probabilityRecommendations.mediumRiskItems} title="中リスク項目" />
          </TabsContent>

          <TabsContent value="impact" className="space-y-6">
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h3 className="text-black font-semibold">影響度に基づく改善推奨事項</h3>
              <p className="text-black mt-2">{impactRecommendations.generalRecommendation}</p>
            </div>
            <RiskItemsList items={impactRecommendations.highRiskItems} title="高リスク項目" />
            <RiskItemsList items={impactRecommendations.mediumRiskItems} title="中リスク項目" />
          </TabsContent>

          <TabsContent value="mitigation" className="space-y-6">
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h3 className="text-black font-semibold">対策レベルに基づく改善推奨事項</h3>
              <p className="text-black mt-2">{mitigationRecommendations.generalRecommendation}</p>
            </div>
            <RiskItemsList items={mitigationRecommendations.highRiskItems} title="高リスク項目" />
            <RiskItemsList items={mitigationRecommendations.mediumRiskItems} title="中リスク項目" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

