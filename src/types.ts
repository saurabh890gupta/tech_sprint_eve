export type DocRating =
  | 'Excellent'
  | 'Good'
  | 'Satisfactory'
  | 'Unsatisfactory'
  | 'Poor'
  | 'None'

export interface QuarterConfig {
  label: string
  fiscalYear: string
  workingDays: number
}

export interface Developer {
  id: string
  name: string
  /** Days available in the quarter before leaves */
  daysInQuarter: number
  leaveDays: number
}

export interface Goal {
  id: string
  name: string
  plannedHours: number
  staging: boolean
  production: boolean
  documentation: DocRating
  notes: string
}

export interface AppState {
  quarter: QuarterConfig
  developers: Developer[]
  goals: Goal[]
}
