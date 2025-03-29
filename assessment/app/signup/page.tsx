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

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
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

    // 開発モードでは認証をスキップ
    if (DEV_MODE) {
      toast({
        title: "開発モード",
        description: "認証をスキップしてダッシュボードにリダイレクトします。",
      })
      router.push("/")
      return
    }

    // パスワード確認
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "エラー",
        description: "パスワードが一致しません。",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await signUp(formData.email, formData.password)

      if (error) {
        toast({
          title: "アカウント作成エラー",
          description: error.message || "アカウントの作成に失敗しました。",
          variant: "destructive",
        })
        return
      }

      // サインアップ成功
      if (data.session) {
        // 自動ログインされた場合
        toast({
          title: "アカウント作成成功",
          description: "ダッシュボードにリダイレクトします。",
        })
        router.push("/")
      } else {
        // メール確認が必要な場合
        toast({
          title: "アカウント作成成功",
          description: "確認メールを送信しました。メールを確認してアカウントを有効化してください。",
        })
        router.push("/login")
      }
    } catch (error) {
      console.error("サインアップエラー:", error)
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
            <CardTitle>アカウント作成</CardTitle>
            <CardDescription>新しいアカウントを作成してください</CardDescription>
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
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "アカウント作成中..." : "アカウント作成"}
              </Button>
              <div className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                  すでにアカウントをお持ちの方はこちら
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

