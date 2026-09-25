export type ParameterKey =
  | 'plannedHours'
  | 'codeQuality'
  | 'efficiency'
  | 'issuePersists'

export interface BandRow {
  id: string
  label: string
  multiplier: number
}

export interface EvalConfig {
  weights: Record<ParameterKey, number>
  bands: Record<ParameterKey, BandRow[]>
  totalBaseScore: number
  sprintsInQuarter: number
}

export interface SprintInput {
  id: string
  name: string
  bands: Record<ParameterKey, string>
}

export interface DeveloperRecord {
  id: string
  name: string
  sprints: SprintInput[]
}

export interface ParameterResult {
  key: ParameterKey
  label: string
  weightage: number
  allocatedPoints: number
  bandLabel: string
  multiplier: number | null
  achievedPoints: number
}

export interface SprintResult {
  parameters: ParameterResult[]
  totalAchieved: number
  pointsPerSprint: number
}

export const PARAMETER_META: {
  key: ParameterKey
  label: string
  short: string
}[] = [
  { key: 'plannedHours', label: 'A. Planned Hours', short: 'Planned Hours' },
  { key: 'codeQuality', label: 'B. Code Quality', short: 'Code Quality' },
  { key: 'efficiency', label: 'C. Efficiency', short: 'Efficiency' },
  { key: 'issuePersists', label: 'D. Issue Persists', short: 'Issue Persists' },
]
