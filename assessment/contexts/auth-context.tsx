"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

// 開発環境では認証を無効化
const DEV_MODE = true // 本番環境にデプロイする前にfalseに戻す

// 開発モード用のモックユーザー
const mockUser = {
  id: "dev-user-id",
  email: "dev@example.com",
  user_metadata: {
    name: "開発ユーザー",
  },
}

// 開発モード用のモックセッション
const mockSession = {
  user: mockUser,
  access_token: "mock-token",
  refresh_token: "mock-refresh-token",
  expires_at: Date.now() + 3600,
}

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
  }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
    data: {
      user: User | null
      session: Session | null
    }
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_MODE ? (mockUser as unknown as User) : null)
  const [session, setSession] = useState<Session | null>(DEV_MODE ? (mockSession as unknown as Session) : null)
  const [isLoading, setIsLoading] = useState(!DEV_MODE)

  useEffect(() => {
    // 開発モードではセッション初期化をスキップ
    if (DEV_MODE) {
      setIsLoading(false)
      return
    }

    // セッションの初期化
    const initializeSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)

        // セッション変更のリスナーを設定
        const {
          data: { subscription },
        } = await supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("認証初期化エラー:", error)
        setIsLoading(false)
      }
    }

    initializeSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    // 開発モードでは常に成功
    if (DEV_MODE) {
      return { error: null }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string) => {
    // 開発モードでは常に成功
    if (DEV_MODE) {
      return {
        data: { user: mockUser as unknown as User, session: mockSession as unknown as Session },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      return {
        error: error as Error,
        data: { user: null, session: null },
      }
    }
  }

  const signOut = async () => {
    // 開発モードではなにもしない
    if (DEV_MODE) {
      console.log("開発モード: サインアウト処理をスキップします")
      return
    }

    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

