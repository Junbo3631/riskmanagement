import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // 認証チェックを無効化して、すべてのリクエストを許可
  return NextResponse.next()
}

// 特定のパスのみにミドルウェアを適用
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

