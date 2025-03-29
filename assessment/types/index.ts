export interface Question {
  id: number
  text: string
  description?: string
  options?: string[] | null
  section_id: number
  display_order?: number
  created_at?: string
  updated_at?: string
}

export interface Answer {
  id: string
  facility_id: string
  question_id: number
  selected_options: string[] | null
  value: string | null
  numeric_value: number | null
  created_at: string
  updated_at: string
}

export interface Section {
  id: number
  name: string
  description?: string
  display_order?: number
  created_at?: string
  updated_at?: string
}

export interface Facility {
  id: string
  name: string
  location?: string
  assessor?: string
  assessment_date?: string
  created_at?: string
  updated_at?: string
}

