"use client"

// lib/questions.ts

export interface Question {
  id: number | string
  section_id: number | string
  text: string
  description?: string
  type: string
  options?: any[] | string | { [key: string]: string }
  required: boolean
  order_index: number
  created_at?: string
  updated_at?: string
  help_text?: string
}

export interface Section {
  id: number
  section_id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

// 質問IDからセクションタイトルを取得する関数
export function getSectionTitle(sectionId: number): string {
  const section = allSections[sectionId as keyof typeof allSections]
  return section ? section.name : "不明なセクション"
}

// allSectionsオブジェクトの型定義
interface AllSections {
  [key: string]: {
    id: number
    section_id: string
    name: string
    description: string
    created_at: string
    updated_at: string
    questions?: {
      [key: string]: Question
    }
  }
}

// allSectionsオブジェクトを定義
export const allSections: AllSections = {
  "1": {
    id: 1,
    section_id: "basic-info",
    name: "基本情報",
    description: "データセンターの基本情報",
    created_at: "",
    updated_at: "",
  },
  "2": {
    id: 2,
    section_id: "building-structure",
    name: "建設および立地",
    description: "建物の構造と立地条件に関する評価項目",
    created_at: "",
    updatedAt: "",
  },
  "3": {
    id: 3,
    section_id: "facility-equipment",
    name: "保護システム",
    description: "セキュリティと保護システムに関する評価項目",
    created_at: "",
    updatedAt: "",
  },
  "4": {
    id: 4,
    section_id: "disaster-risk",
    name: "ユーティリティ",
    description: "電力、冷却などのユーティリティに関する評価項目",
    created_at: "",
    updatedAt: "",
  },
  "5": {
    id: 5,
    section_id: "operations-maintenance",
    name: "ハザード対策",
    description: "災害対策と緊急時の対応に関する評価項目",
    created_at: "",
    updatedAt: "",
  },
  "basic-info": {
    id: 1,
    section_id: "basic-info",
    name: "基本情報",
    description: "データセンターの基本情報",
    created_at: "",
    updatedAt: "",
  },
  "building-structure": {
    id: 2,
    section_id: "building-structure",
    name: "建設および立地",
    description: "建物の構造と立地条件に関する評価項目",
    created_at: "",
    updatedAt: "",
  },
  "facility-equipment": {
    id: 3,
    section_id: "facility-equipment",
    name: "保護システム",
    description: "セキュリティと保護システムに関する評価項目",
    created_at: "",
    updatedAt: "",
  },
  "disaster-risk": {
    id: 4,
    section_id: "disaster-risk",
    name: "ユーティリティ",
    description: "電力、冷却などのユーティリティに関する評価項目",
    created_at: "",
    updatedAt: "",
  },
  "operations-maintenance": {
    id: 5,
    section_id: "operations-maintenance",
    name: "ハザード対策",
    description: "災害対策と緊急時の対応に関する評価項目",
    created_at: "",
    updatedAt: "",
  },
  "hazard-countermeasures": {
    id: 5,
    section_id: "hazard-countermeasures",
    name: "ハザード対策",
    description: "災害対策と緊急時の対応に関する評価項目",
    created_at: "",
    updatedAt: "",
  },
}

