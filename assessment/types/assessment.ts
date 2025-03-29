export interface Section {
  id: number
  section_id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: number | string
  section_id: number | string
  text: string
  description?: string
  type: string
  options?: Option[] | string
  created_at: string
  updated_at: string
}

export interface Option {
  id: string
  question_id: number | string
  text: string
  value: string | number
  created_at: string
  updated_at: string
}

export interface Answer {
  id?: number
  question_id: number | string
  facility_id: string
  selected_options: string[]
  text_value?: string | null
  numeric_value?: number | null
  created_at?: string
  updated_at?: string
}

export interface Facility {
  id: string
  name: string
  location: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Assessment {
  id: string
  name: string
  location: string
  description?: string
  created_at: string
  updated_at: string
  progress?: number
  sections?: SectionProgress[]
}

export interface SectionProgress {
  id: number
  section_id: string
  name: string
  description: string
  progress: number
  answered: number
  total: number
}

