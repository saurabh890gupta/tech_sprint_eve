import { PARAMETER_META } from './types'
import type {
  EvalConfig,
  ParameterKey,
  ParameterResult,
  SprintResult,
} from './types'

/** Excel: Points Per Sprint = Total Base Score / No. of Sprints */
export function pointsPerSprint(config: EvalConfig): number {
  if (!config.sprintsInQuarter) return 0
  return config.totalBaseScore / config.sprintsInQuarter
}

/** Excel: TOTAL weightage = SUM(C3:C6) */
export function totalWeightage(config: EvalConfig): number {
  return (
    config.weights.plannedHours +
    config.weights.codeQuality +
    config.weights.efficiency +
    config.weights.issuePersists
  )
}

/** Excel XLOOKUP equivalent — exact label match */
export function lookupMultiplier(
  config: EvalConfig,
  key: ParameterKey,
  bandLabel: string,
): number | null {
  const row = config.bands[key].find((b) => b.label === bandLabel)
  return row ? row.multiplier : null
}

/**
 * Excel formulas from Developer_Evaulation_Parameters:
 * - Allocated Points  = PointsPerSprint * Weightage
 * - Multiplier        = XLOOKUP(band, bandTable)
 * - Achieved Points   = Multiplier * Allocated Points
 * - Sprint Total      = SUM(all achieved points)
 */
export function calculateSprint(
  config: EvalConfig,
  selectedBands: Record<ParameterKey, string>,
): SprintResult {
  const pps = pointsPerSprint(config)
  const parameters: ParameterResult[] = PARAMETER_META.map(({ key, label }) => {
    const weightage = config.weights[key]
    const allocatedPoints = pps * weightage
    const bandLabel = selectedBands[key] ?? ''
    const multiplier = lookupMultiplier(config, key, bandLabel)
    const achievedPoints =
      multiplier === null ? 0 : multiplier * allocatedPoints

    return {
      key,
      label,
      weightage,
      allocatedPoints,
      bandLabel,
      multiplier,
      achievedPoints,
    }
  })

  const totalAchieved = parameters.reduce((sum, p) => sum + p.achievedPoints, 0)
  return { parameters, totalAchieved, pointsPerSprint: pps }
}

/** Excel: Net Score = Total Achieved Points × No. of Sprints */
export function netQuarterFromBenchmark(
  sprintTotal: number,
  sprintsInQuarter: number,
): number {
  return sprintTotal * sprintsInQuarter
}

export function round(n: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round((n + Number.EPSILON) * f) / f
}

export function formatNumber(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  return round(n, digits).toFixed(digits)
}
