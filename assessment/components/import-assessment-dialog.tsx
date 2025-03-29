"use client"

import type React from "react"

import { useState } from "react"
import { FileUp, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ImportAssessmentDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = () => {
    if (!file) return

    setIsUploading(true)

    // ファイルアップロードのシミュレーション
    setTimeout(() => {
      setIsUploading(false)
      setIsOpen(false)
      setFile(null)
      // 成功メッセージを表示するなどの処理をここに追加
    }, 1500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>評価データのインポート</DialogTitle>
          <DialogDescription>過去の評価データをインポートして、新しい評価プロジェクトを作成します。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">ファイルを選択</Label>
            <div className="flex items-center gap-2">
              <Input id="file" type="file" accept=".json,.csv,.xlsx" onChange={handleFileChange} className="flex-1" />
            </div>
            {file && <p className="text-sm text-muted-foreground">選択されたファイル: {file.name}</p>}
          </div>
          <div className="rounded-md border border-dashed p-8 text-center">
            <div className="mx-auto flex max-w-[180px] flex-col items-center justify-center gap-2">
              <FileUp className="h-10 w-10 text-muted-foreground" />
              <div className="text-sm font-medium">ファイルをドラッグ＆ドロップ</div>
              <div className="text-xs text-muted-foreground">サポートされているファイル形式: .json, .csv, .xlsx</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleImport} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                インポート中...
              </>
            ) : (
              "インポート"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

