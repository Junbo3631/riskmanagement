import type { Facility } from "@/types/facility"

interface AssessmentSummaryProps {
  assessment: Facility
}

export function AssessmentSummary({ assessment }: AssessmentSummaryProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">評価概要</h3>

      <div className="mb-4">
        <h4 className="text-lg font-medium mb-2">進捗状況</h4>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${assessment.progress || 0}%` }}></div>
        </div>
        <p className="text-right mt-1 text-sm text-gray-600">{Math.round(assessment.progress || 0)}% 完了</p>
      </div>

      <div className="mb-4">
        <h4 className="text-lg font-medium mb-2">施設情報</h4>
        <p>
          <span className="font-medium">名称:</span> {assessment.name}
        </p>
        <p>
          <span className="font-medium">場所:</span> {assessment.location || "未設定"}
        </p>
        <p>
          <span className="font-medium">種類:</span> {assessment.type || "未設定"}
        </p>
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">評価ステータス</h4>
        <p>
          <span className="font-medium">作成日:</span> {new Date(assessment.created_at).toLocaleDateString("ja-JP")}
        </p>
        {assessment.last_updated && (
          <p>
            <span className="font-medium">最終更新:</span>{" "}
            {new Date(assessment.last_updated).toLocaleDateString("ja-JP")}
          </p>
        )}
        <p>
          <span className="font-medium">ステータス:</span> {assessment.status || "進行中"}
        </p>
      </div>
    </div>
  )
}

