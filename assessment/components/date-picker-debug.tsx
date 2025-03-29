"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function DatePickerDebug() {
  const [date, setDate] = useState<Date>()
  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toISOString().split("T")[1].split(".")[0]} - ${info}`])
  }

  const handleButtonClick = () => {
    addDebugInfo(`ボタンがクリックされました。現在の状態: ${isOpen ? "開" : "閉"}`)
    setIsOpen(!isOpen)
  }

  const handleSelect = (selectedDate: Date | undefined) => {
    addDebugInfo(`日付が選択されました: ${selectedDate?.toISOString() || "undefined"}`)
    setDate(selectedDate)
    setIsOpen(false)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium">日付ピッカーデバッグ</h3>

      <div className="flex flex-col space-y-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              onClick={handleButtonClick}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={handleSelect} initialFocus locale={ja} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">デバッグ情報:</h4>
        <div className="bg-white p-2 rounded border h-40 overflow-y-auto text-xs">
          {debugInfo.length === 0 ? (
            <p className="text-gray-500">まだ操作が行われていません</p>
          ) : (
            <ul className="space-y-1">
              {debugInfo.map((info, index) => (
                <li key={index}>{info}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

