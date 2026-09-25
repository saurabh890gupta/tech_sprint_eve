import type { EvalConfig, ParameterKey } from './types'

function band(label: string, multiplier: number) {
  return {
    id: crypto.randomUUID(),
    label,
    multiplier,
  }
}

/** Defaults mirrored from Developer_Evaulation_Parameters sheet */
export const DEFAULT_CONFIG: EvalConfig = {
  weights: {
    plannedHours: 0.6,
    codeQuality: 0.2,
    efficiency: 0.2,
    issuePersists: 0,
  },
  bands: {
    plannedHours: [
      band('90 - 100', 1.75),
      band('80 - 90', 1.5),
      band('70 - 80', 1.2),
      band('60 - 70', 1),
      band('50 - 60', 0.75),
      band('40 - 50', 0.5),
      band('30 - 40', 0.3),
      band('Below 30', 0),
    ],
    codeQuality: [
      band('Outstanding', 1.5),
      band('Good', 1.3),
      band('Satisfactory', 1),
      band('Needs Improvement', 0.6),
      band('Unsatisfactory', 0.3),
      band('Poor', -0.3),
    ],
    efficiency: [
      band('100 % +', 1.3),
      band('91 -100 %', 1.1),
      band('81 - 90 %', 0.8),
      band('71 - 80 %', 0.4),
      band('70 % and Below', 0.2),
    ],
    issuePersists: [
      band('0 - 10 %', 1.5),
      band('10 - 20 %', 1),
      band('20 - 30 %', 0.7),
      band('30 - 40 %', 0.3),
      band('40 & Above', -0.5),
    ],
  },
  totalBaseScore: 90,
  sprintsInQuarter: 6,
}

export const DEFAULT_SIMULATOR_BANDS: Record<ParameterKey, string> = {
  plannedHours: 'Below 30',
  codeQuality: 'Satisfactory',
  efficiency: '91 -100 %',
  issuePersists: '0 - 10 %',
}

export const STORAGE_KEY = 'dev-eval-config-v1'
