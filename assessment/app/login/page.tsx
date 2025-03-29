"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

// 開発環境では認証を無効化
const DEV_MODE = true // 本番環境にデプロイする前にfalseに戻す

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // 開発モードでは自動的にダッシュボードにリダイレクト
  useEffect(() => {
    if (DEV_MODE) {
      router.push("/")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return
    setIsLoading(true)

    // 開発モードでは認証をスキップ
    if (DEV_MODE) {
      toast({
        title: "開発モード",
        description: "認証をスキップしてダッシュボードにリダイレクトします。",
      })
      router.push("/")
      return
    }

    try {
      const { error } = await signIn(formData.email, formData.password)

      if (error) {
        toast({
          title: "ログインエラー",
          description: error.message || "ログインに失敗しました。メールアドレスとパスワードを確認してください。",
          variant: "destructive",
        })
        return
      }

      // ログイン成功
      toast({
        title: "ログイン成功",
        description: "ダッシュボードにリダイレクトします。",
      })

      // ダッシュボードにリダイレクト
      router.push("/")
    } catch (error) {
      console.error("ログインエラー:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 開発モードではローディング表示
  if (DEV_MODE) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <p>開発モード: ダッシュボードにリダイレクトしています...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Building2 className="h-5 w-5" />
          <span>データセンターリスク評価ツール</span>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
            <CardDescription>アカウント情報を入力してログインしてください</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
              <div className="text-center text-sm">
                <Link href="/signup" className="text-primary hover:underline">
                  アカウントをお持ちでない方はこちら
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

