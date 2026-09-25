import type { DocRating, Developer, Goal, QuarterConfig } from './types'

/** Delivery parameter weightages from the Engineering goals sheet */
export const STAGING_WEIGHT = 0.5
export const PRODUCTION_WEIGHT = 0.5

export const DOC_RATING_WEIGHTS: Record<DocRating, number> = {
  Excellent: 0.25,
  Good: 0.2,
  Satisfactory: 0.15,
  Unsatisfactory: 0.1,
  Poor: 0.05,
  None: 0,
}

export const ACQUIRED_SCORE_MULTIPLIER = 120

/** Fixed productive hours per working day (as per team rule) */
export const HOURS_PER_DAY = 6

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function developerPresentDays(dev: Developer): number {
  return Math.max(0, Number(dev.daysInQuarter) - Number(dev.leaveDays))
}

export function developerProductiveHours(dev: Developer): number {
  return developerPresentDays(dev) * HOURS_PER_DAY
}

/** Staging 50% + Production 50% → 0, 0.5, or 1.0 (Production implies Staging) */
export function goalDeploymentFactor(goal: Goal): number {
  const staging = goal.staging || goal.production
  const production = goal.production
  return (staging ? STAGING_WEIGHT : 0) + (production ? PRODUCTION_WEIGHT : 0)
}

/** Documentation weight — used only for Achieved */
export function goalDocWeight(goal: Goal): number {
  return DOC_RATING_WEIGHTS[goal.documentation]
}

export function goalCompletionPercent(goal: Goal): number {
  return goalDeploymentFactor(goal) * 100
}

export interface GoalScore {
  id: string
  name: string
  plannedHours: number
  deploymentFactor: number
  docWeight: number
  completionPercent: number
  /** Full points before deployment: (Planned / Productive) × 120 */
  basePoints: number
  /**
   * Achievable = base × Deployment (0% / 50% staging only / 100% both)
   */
  achievablePoints: number
  /** Achieved = Achievable × (1 + Doc %) — documentation only */
  achievedPoints: number
}

export interface ScoreSummary {
  projectedHours: number
  actualDevelopmentHours: number
  acquiredScore: number
  /** Sum of per-KPI Achieved points */
  deliveryAdjustedScore: number
  /** Sum of per-goal achieved points */
  totalAchievedPoints: number
  totalAchievablePoints: number
  averageGoalCompletion: number
  goalScores: GoalScore[]
  developerHours: {
    id: string
    name: string
    presentDays: number
    hours: number
  }[]
  totalPresentDays: number
}

export function calculateScores(
  _quarter: QuarterConfig,
  developers: Developer[],
  goals: Goal[],
): ScoreSummary {
  const developerHours = developers.map((d) => ({
    id: d.id,
    name: d.name || 'Unnamed',
    presentDays: developerPresentDays(d),
    hours: developerProductiveHours(d),
  }))

  const actualDevelopmentHours = developerHours.reduce((s, d) => s + d.hours, 0)
  const totalPresentDays = developerHours.reduce((s, d) => s + d.presentDays, 0)
  const projectedHours = goals.reduce((s, g) => s + (Number(g.plannedHours) || 0), 0)

  const acquiredScore =
    actualDevelopmentHours > 0
      ? (projectedHours / actualDevelopmentHours) * ACQUIRED_SCORE_MULTIPLIER
      : 0

  const goalScores: GoalScore[] = goals.map((goal) => {
    const plannedHours = Number(goal.plannedHours) || 0
    const deploymentFactor = goalDeploymentFactor(goal)
    const docWeight = goalDocWeight(goal)
    const completionPercent = deploymentFactor * 100
    /** Full score before staging/production */
    const basePoints =
      actualDevelopmentHours > 0
        ? (plannedHours / actualDevelopmentHours) * ACQUIRED_SCORE_MULTIPLIER
        : 0
    /** Achievable applies Deployment % (0 / 50 / 100) */
    const achievablePoints = basePoints * deploymentFactor
    /** Achieved = documentation bonus only on Achievable */
    const achievedPoints = achievablePoints * (1 + docWeight)

    return {
      id: goal.id,
      name: goal.name,
      plannedHours,
      deploymentFactor,
      docWeight,
      completionPercent,
      basePoints,
      achievablePoints,
      achievedPoints,
    }
  })

  const totalAchievedPoints = goalScores.reduce((s, g) => s + g.achievedPoints, 0)
  const totalAchievablePoints = goalScores.reduce((s, g) => s + g.achievablePoints, 0)

  const averageGoalCompletion =
    goalScores.length > 0
      ? goalScores.reduce((s, g) => s + g.completionPercent, 0) / goalScores.length
      : 0

  /** Sum of per-KPI Achieved (Achievable + Achievable × Doc%) */
  const deliveryAdjustedScore = totalAchievedPoints

  return {
    projectedHours,
    actualDevelopmentHours,
    acquiredScore,
    deliveryAdjustedScore,
    totalAchievedPoints,
    totalAchievablePoints,
    averageGoalCompletion,
    goalScores,
    developerHours,
    totalPresentDays,
  }
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}
