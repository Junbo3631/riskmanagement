export interface Facility {
  id: string
  name: string
}

export interface QuestionOption {
  option_id: string | number // 整数型または文字列型
  question_id: string
  category: string
  risk_factor: string
  risk_score: number
  weight: number
}

export interface Answer {
  id: string
  facility_id: string
  question_id: string
  selected_option_ids: number[] | string | any // JSONB型（配列）または文字列
}

export interface RiskScore {
  facility_id: string
  facility_name: string
  risk_category: string
  risk_score: number
  risk_level: "low" | "medium" | "high" | "none"
}

export interface IncidentCase {
  incident_id: string
  incident_date: string
  facility_name: string
  risk_category: string
  incident_summary: string
  incident_detail: string
  cause: string
  impact: string
  recovery_actions: string
  incident_severity: number
  insurance_claimed: boolean
  insurance_amount: number | null
}

