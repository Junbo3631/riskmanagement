import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function EvaluationCriteriaSection() {
  return (
    <section className="w-full bg-slate-100 py-8">
      <div className="container mx-auto px-4">
        <h2 className="mb-6 text-2xl font-bold text-center text-slate-800">評価基準について</h2>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-200">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-slate-50 data-[state=active]:text-slate-900"
            >
              概要
            </TabsTrigger>
            <TabsTrigger value="scoring" className="data-[state=active]:bg-slate-50 data-[state=active]:text-slate-900">
              スコアリング方法
            </TabsTrigger>
            <TabsTrigger value="levels" className="data-[state=active]:bg-slate-50 data-[state=active]:text-slate-900">
              リスクレベル
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="bg-white border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-800">データセンターリスク評価の概要</CardTitle>
                <CardDescription className="text-slate-600">
                  FM
                  Global社のデータセンター向け施設・設備リスク評価項目に基づき、体系的なリスクスコアリングを行います。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-slate-700">
                  データセンターリスク評価は、施設の物理的特性、設備の状態、災害リスク、運用・保守体制など、
                  複数の要素を考慮して総合的なリスクスコアを算出します。
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-2 text-lg font-medium text-slate-800">評価の目的</h3>
                    <ul className="ml-4 list-disc space-y-2 text-sm text-slate-700">
                      <li>潜在的な脆弱性の特定</li>
                      <li>災害時の事業継続性の向上</li>
                      <li>リスク軽減策の優先順位付け</li>
                      <li>コンプライアンス要件の遵守</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-2 text-lg font-medium text-slate-800">評価プロセス</h3>
                    <ol className="ml-4 list-decimal space-y-2 text-sm text-slate-700">
                      <li>基本情報の入力</li>
                      <li>建設および立地の評価</li>
                      <li>保護システムの評価</li>
                      <li>ユーティリティの評価</li>
                      <li>ハザード対策の評価</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scoring">
            <Card className="bg-white border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-800">スコアリング方法</CardTitle>
                <CardDescription className="text-slate-600">
                  各セクションの回答に基づいて、リスクスコアが計算されます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-slate-700">
                  リスクスコアは0〜5の範囲で表され、数値が低いほどリスクが高いことを示します。
                  各セクションには重み付けがあり、総合スコアに異なる影響を与えます。
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="py-2 px-4 text-left text-slate-800">セクション</th>
                        <th className="py-2 px-4 text-left text-slate-800">重み付け</th>
                        <th className="py-2 px-4 text-left text-slate-800">主な評価項目</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.2.1 一般</td>
                        <td className="py-2 px-4 text-slate-700">1.2</td>
                        <td className="py-2 px-4 text-slate-700">建物の築年数、構造点検・耐震補強、定期点検体制</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.2.2 壁</td>
                        <td className="py-2 px-4 text-slate-700">1.3</td>
                        <td className="py-2 px-4 text-slate-700">壁材の耐火性能、防火区画の機能、防火対策</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.2.3 ドアと窓</td>
                        <td className="py-2 px-4 text-slate-700">1.2</td>
                        <td className="py-2 px-4 text-slate-700">ドア・窓の気密性、防火・防水・セキュリティ対策</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.2.4 貫通部</td>
                        <td className="py-2 px-4 text-slate-700">1.4</td>
                        <td className="py-2 px-4 text-slate-700">
                          ケーブル・配管貫通部の密閉状況、防火シール材、定期点検
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.2.5～2.2.12 建物その他要素</td>
                        <td className="py-2 px-4 text-slate-700">1.1</td>
                        <td className="py-2 px-4 text-slate-700">
                          立地環境リスク、構造的損傷時の影響、耐震・防火・防水設計
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.3.x 火災検知・消火</td>
                        <td className="py-2 px-4 text-slate-700">2.0</td>
                        <td className="py-2 px-4 text-slate-700">
                          火災検知システム、消火方式（ガス消火/スプリンクラー）、定期点検
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.4.x 監視・セキュリティ</td>
                        <td className="py-2 px-4 text-slate-700">1.5</td>
                        <td className="py-2 px-4 text-slate-700">
                          監視カメラ、入退室管理、多層防御策、セキュリティ監査
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.5.x 電源系統</td>
                        <td className="py-2 px-4 text-slate-700">2.0</td>
                        <td className="py-2 px-4 text-slate-700">
                          停電・電源障害頻度、UPS・発電機冗長構成、バックアップ運転時間
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.6.x 空調系統</td>
                        <td className="py-2 px-4 text-slate-700">1.5</td>
                        <td className="py-2 px-4 text-slate-700">空調障害頻度、温度上昇リスク、空調システムの冗長性</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">2.7.x その他設備</td>
                        <td className="py-2 px-4 text-slate-700">1.2</td>
                        <td className="py-2 px-4 text-slate-700">配管・排水設備の障害履歴、運用影響、予備品・冗長性</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">3.1.x 自然災害</td>
                        <td className="py-2 px-4 text-slate-700">2.0</td>
                        <td className="py-2 px-4 text-slate-700">
                          地域の災害リスク、最大規模災害の想定影響、包括的対策
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">3.2.x 洪水リスク</td>
                        <td className="py-2 px-4 text-slate-700">1.8</td>
                        <td className="py-2 px-4 text-slate-700">
                          洪水区域の有無、浸水時の影響、防水壁・排水ポンプなどの対策
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">3.3.x 地震リスク</td>
                        <td className="py-2 px-4 text-slate-700">1.8</td>
                        <td className="py-2 px-4 text-slate-700">地震活動度、耐震構造・設備損傷リスク、地震BCP対策</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-4 text-slate-700">3.4.x 風害・雷害リスク</td>
                        <td className="py-2 px-4 text-slate-700">1.5</td>
                        <td className="py-2 px-4 text-slate-700">
                          強風・落雷リスク、SPD・避雷設備、屋外設備の耐風対策
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-slate-700">3.5.x 事業継続計画</td>
                        <td className="py-2 px-4 text-slate-700">1.7</td>
                        <td className="py-2 px-4 text-slate-700">BCP整備状況、SLA/RTO/RPO目標、代替サイト・訓練</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="levels">
            <Card className="bg-white border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-800">リスクレベル</CardTitle>
                <CardDescription className="text-slate-600">
                  総合スコアに基づいて、リスクレベルが決定されます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-slate-700">
                  評価結果は、低・中・高の3段階のリスクレベルに分類されます。
                  各レベルには推奨される対応策が含まれています。
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h3 className="mb-2 text-lg font-medium text-green-800">低リスク (1.0未満)</h3>
                    <p className="text-sm text-green-700">
                      施設は十分な耐性を持ち、災害リスクが適切に管理されています。
                      定期的な評価と維持管理を継続してください。
                    </p>
                  </div>
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <h3 className="mb-2 text-lg font-medium text-yellow-800">中リスク (1.0〜2.0)</h3>
                    <p className="text-sm text-yellow-700">
                      いくつかの脆弱性が存在します。特定された問題に対処するための
                      改善計画を策定し、優先順位を付けて実施してください。
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h3 className="mb-2 text-lg font-medium text-red-800">高リスク (2.0以上)</h3>
                    <p className="text-sm text-red-700">
                      重大な脆弱性が存在します。早急に対策を講じる必要があります。
                      専門家による詳細な評価と改善計画の策定を検討してください。
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-2 text-lg font-medium text-slate-800">スコアリング要素の定義</h3>
                  <ul className="ml-4 list-disc space-y-2 text-sm text-slate-700">
                    <li>
                      <strong className="text-slate-800">低リスク施設:</strong> 年1回の評価を推奨
                    </li>
                    <li>
                      <strong className="text-slate-800">中リスク施設:</strong> 半年ごとの評価を推奨
                    </li>
                    <li>
                      <strong className="text-slate-800">高リスク施設:</strong>{" "}
                      四半期ごとの評価と、改善策実施後の再評価を推奨
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

