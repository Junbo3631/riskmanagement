import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "リスクマネジメントダッシュボード",
  description: "施設のリスク評価と事故事例を管理するダッシュボード",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <header className="border-b">
          <div className="container mx-auto py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">
              <Link href="/dashboard">リスクマネジメントダッシュボード</Link>
            </h1>
            <nav>
              <ul className="flex gap-4">
                <li>
                  <Link href="/dashboard" className="hover:underline">
                    ダッシュボード
                  </Link>
                </li>
                <li>
                  <Link href="/debug-env" className="hover:underline text-gray-500">
                    環境変数確認
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}



import './globals.css'