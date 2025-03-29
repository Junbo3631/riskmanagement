import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, ShieldCheck, BarChart3 } from "lucide-react"

interface RiskItem {
  questionId: string
  question: string
  answer: string | string[]
  riskScore: number
  recommendation: string
}

interface CategoryRecommendations {
  highRiskItems: RiskItem[]
  mediumRiskItems: RiskItem[]
  generalRecommendation: string
}

interface RiskRecommendationsProps {
  recommendations?: {
    probabilityRecommendations?: CategoryRecommendations
    impactRecommendations?: CategoryRecommendations
    mitigationRecommendations?: CategoryRecommendations
    totalRiskRecommendations?: CategoryRecommendations
  } | null
}

export function RiskRecommendations({ recommendations }: RiskRecommendationsProps) {
  if (!recommendations) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">リスク改善推奨事項</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            リスク評価が完了すると、ここに改善推奨事項が表示されます。すべてのセクションの質問に回答し、リスクスコアを計算してください。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">リスク改善推奨事項</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="probability" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="probability" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">発生確率</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">影響度</span>
            </TabsTrigger>
            <TabsTrigger value="mitigation" className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">対策レベル</span>
            </TabsTrigger>
            <TabsTrigger value="total" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">総合リスク</span>
            </TabsTrigger>
          </TabsList>

          {/* 発生確率タブ */}
          <TabsContent value="probability">
            <RecommendationContent
              title="発生確率に基づく改善推奨事項"
              recommendations={recommendations.probabilityRecommendations}
            />
          </TabsContent>

          {/* 影響度タブ */}
          <TabsContent value="impact">
            <RecommendationContent
              title="影響度に基づく改善推奨事項"
              recommendations={recommendations.impactRecommendations}
            />
          </TabsContent>

          {/* 対策レベルタブ */}
          <TabsContent value="mitigation">
            <RecommendationContent
              title="対策レベルに基づく改善推奨事項"
              recommendations={recommendations.mitigationRecommendations}
            />
          </TabsContent>

          {/* 総合リスクタブ */}
          <TabsContent value="total">
            <RecommendationContent
              title="総合リスクに基づく改善推奨事項"
              recommendations={recommendations.totalRiskRecommendations}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface RecommendationContentProps {
  title: string
  recommendations?: CategoryRecommendations
}

function RecommendationContent({ title, recommendations }: RecommendationContentProps) {
  if (!recommendations) {
    return (
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-center">
        <p className="text-gray-500">このカテゴリーの推奨事項はまだ生成されていません。</p>
      </div>
    )
  }

  const { highRiskItems = [], mediumRiskItems = [], generalRecommendation = "" } = recommendations

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <h3 className="text-md font-medium text-black">{title}</h3>
        <p className="text-sm text-black mt-2">{generalRecommendation}</p>
      </div>

      {/* 高リスク項目 */}
      {highRiskItems && highRiskItems.length > 0 && (
        <div className="mt-4 bg-white p-4 rounded-md border border-gray-200">
          <h4 className="text-sm font-medium flex items-center mb-2 text-black">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
            高リスク項目
          </h4>
          <div className="space-y-3">
            {highRiskItems.map((item) => (
              <div key={item.questionId} className="bg-red-50 p-3 rounded-md border border-red-100">
                <div className="flex justify-between">
                  <div className="font-medium text-sm text-black">{item.question}</div>
                  <div className="text-red-600 text-sm font-bold">スコア: {item.riskScore}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  回答: {Array.isArray(item.answer) ? item.answer.join(", ") : item.answer}
                </div>
                <div className="text-sm font-medium text-red-700 mt-2">推奨対策: {item.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 中リスク項目 */}
      {mediumRiskItems && mediumRiskItems.length > 0 && (
        <div className="mt-4 bg-white p-4 rounded-md border border-gray-200">
          <h4 className="text-sm font-medium flex items-center mb-2 text-black">
            <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
            中リスク項目
          </h4>
          <div className="space-y-3">
            {mediumRiskItems.map((item) => (
              <div key={item.questionId} className="bg-amber-50 p-3 rounded-md border border-amber-100">
                <div className="flex justify-between">
                  <div className="font-medium text-sm text-black">{item.question}</div>
                  <div className="text-amber-600 text-sm font-bold">スコア: {item.riskScore}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  回答: {Array.isArray(item.answer) ? item.answer.join(", ") : item.answer}
                </div>
                <div className="text-sm font-medium text-amber-700 mt-2">推奨対策: {item.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* リスク項目がない場合 */}
      {(!highRiskItems || highRiskItems.length === 0) && (!mediumRiskItems || mediumRiskItems.length === 0) && (
        <div className="bg-white p-4 rounded-md border border-gray-200 text-center">
          <ShieldCheck className="h-5 w-5 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">このカテゴリーには高リスク項目または中リスク項目はありません。</p>
        </div>
      )}
    </div>
  )
}

