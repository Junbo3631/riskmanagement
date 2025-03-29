"use client"
import { LogOut, Shield, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 開発環境では認証を無効化
const DEV_MODE = true // 本番環境にデプロイする前にfalseに戻す

export function Header() {
  const router = useRouter()
  const { toast } = useToast()

  // 本番環境では実際の認証を使用
  let user = null
  let signOut = null

  const auth = useAuth() // Move useAuth outside the conditional block

  if (!DEV_MODE) {
    user = auth.user
    signOut = auth.signOut
  } else {
    // 開発環境用のモックデータ
    user = { email: "dev@example.com" }
    signOut = async () => {
      console.log("Mock sign out")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "ログアウト成功",
        description: "ログアウトしました。",
      })
      router.push("/login")
    } catch (error) {
      console.error("ログアウトエラー:", error)
      toast({
        title: "エラー",
        description: "ログアウト中にエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-blue-600" />
          <span className="ml-1 font-bold text-blue-600">InsuraMetrics</span>
        </div>
        <div className="ml-2 h-5 border-l border-gray-300"></div>
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span className="text-blue-600">データセンター</span>
          <span className="text-gray-800">リスク評価</span>
        </div>
      </Link>
      <nav className="ml-auto flex items-center gap-4">
        <a
          href="https://v0-insura-metrics.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <Home className="h-4 w-4" />
          <span>InsuraMetricsホームに戻る</span>
        </a>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <span className="sr-only">ユーザーメニュー</span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "hsl(215, 50%, 35%)", color: "white" }}
              >
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
            <DropdownMenuItem>
              <span>{user?.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>ログアウト</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  )
}

