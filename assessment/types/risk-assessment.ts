// 質問の型定義
export interface Question {
  id: number
  section_id: number
  text: string
  description?: string
  type: string
  options?: string
  required: boolean
  order: number
  created_at?: string
  updated_at?: string
}

// セクションの型定義
export interface Section {
  id: number
  title: string
  description?: string
  order: number
  created_at?: string
  updated_at?: string
}

// 回答の型定義
export interface Answer {
  id?: number
  assessment_id: string
  question_id: number
  section_id: number
  selected_options: Array<{ value: string; label: string }> | null
  notes?: string
  created_at?: string
  updated_at?: string
}

// 評価の型定義
export interface Assessment {
  id: string
  title: string
  description?: string
  status: string
  created_by: string
  created_at?: string
  updated_at?: string
}

export interface Facility {
  id: string
  name: string
  location: string
  type?: string
  description?: string
  created_at: string
  last_updated?: string
  progress?: number
}

