import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_CONFIG, STORAGE_KEY } from './defaults'
import type { BandRow, EvalConfig, ParameterKey } from './types'

function cloneConfig(config: EvalConfig): EvalConfig {
  return structuredClone(config)
}

function loadConfig(): EvalConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneConfig(DEFAULT_CONFIG)
    const parsed = JSON.parse(raw) as EvalConfig
    return { ...cloneConfig(DEFAULT_CONFIG), ...parsed }
  } catch {
    return cloneConfig(DEFAULT_CONFIG)
  }
}

export function useEvalConfig() {
  const [config, setConfig] = useState<EvalConfig>(() => loadConfig())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  const resetConfig = useCallback(() => {
    setConfig(cloneConfig(DEFAULT_CONFIG))
  }, [])

  const setWeight = useCallback((key: ParameterKey, value: number) => {
    setConfig((prev) => ({
      ...prev,
      weights: { ...prev.weights, [key]: value },
    }))
  }, [])

  const setBaseScore = useCallback((totalBaseScore: number) => {
    setConfig((prev) => ({ ...prev, totalBaseScore }))
  }, [])

  const setSprintsInQuarter = useCallback((sprintsInQuarter: number) => {
    setConfig((prev) => ({ ...prev, sprintsInQuarter }))
  }, [])

  const updateBand = useCallback(
    (key: ParameterKey, id: string, patch: Partial<BandRow>) => {
      setConfig((prev) => ({
        ...prev,
        bands: {
          ...prev.bands,
          [key]: prev.bands[key].map((row) =>
            row.id === id ? { ...row, ...patch } : row,
          ),
        },
      }))
    },
    [],
  )

  const addBand = useCallback((key: ParameterKey) => {
    setConfig((prev) => ({
      ...prev,
      bands: {
        ...prev.bands,
        [key]: [
          ...prev.bands[key],
          { id: crypto.randomUUID(), label: 'New band', multiplier: 1 },
        ],
      },
    }))
  }, [])

  const removeBand = useCallback((key: ParameterKey, id: string) => {
    setConfig((prev) => ({
      ...prev,
      bands: {
        ...prev.bands,
        [key]: prev.bands[key].filter((row) => row.id !== id),
      },
    }))
  }, [])

  return {
    config,
    setConfig,
    resetConfig,
    setWeight,
    setBaseScore,
    setSprintsInQuarter,
    updateBand,
    addBand,
    removeBand,
  }
}
