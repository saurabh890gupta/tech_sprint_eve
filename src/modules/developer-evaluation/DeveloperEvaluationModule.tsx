import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  calculateSprint,
  formatNumber,
  netQuarterFromBenchmark,
  pointsPerSprint,
  totalWeightage,
} from './calc'
import { DEFAULT_CONFIG, DEFAULT_SIMULATOR_BANDS } from './defaults'
import { PARAMETER_META } from './types'
import type { DeveloperRecord, EvalConfig, ParameterKey, SprintInput } from './types'
import { useEvalConfig } from './useEvalConfig'
import './developer-evaluation.css'

type Tab = 'parameters' | 'simulator' | 'sprints'

function newSprint(index: number, config: EvalConfig): SprintInput {
  return {
    id: crypto.randomUUID(),
    name: `Sprint ${index}`,
    bands: {
      plannedHours: config.bands.plannedHours[0]?.label ?? '',
      codeQuality: config.bands.codeQuality[2]?.label ?? '',
      efficiency: config.bands.efficiency[1]?.label ?? '',
      issuePersists: config.bands.issuePersists[0]?.label ?? '',
    },
  }
}

function newDeveloper(config: EvalConfig, name = 'New Developer'): DeveloperRecord {
  return {
    id: crypto.randomUUID(),
    name,
    sprints: Array.from({ length: Math.max(1, config.sprintsInQuarter) }, (_, i) => ({
      ...newSprint(34 + i, config),
      bands: { ...DEFAULT_SIMULATOR_BANDS },
    })),
  }
}

export default function DeveloperEvaluationModule() {
  const {
    config,
    resetConfig,
    setWeight,
    setBaseScore,
    setSprintsInQuarter,
    updateBand,
    addBand,
    removeBand,
  } = useEvalConfig()
  const [tab, setTab] = useState<Tab>('simulator')
  const [simBands, setSimBands] = useState<Record<ParameterKey, string>>({
    ...DEFAULT_SIMULATOR_BANDS,
  })
  const [developers, setDevelopers] = useState<DeveloperRecord[]>([
    newDeveloper(DEFAULT_CONFIG, 'Sample Developer'),
  ])
  const simResult = useMemo(() => calculateSprint(config, simBands), [config, simBands])
  const weightTotal = totalWeightage(config)
  const pps = pointsPerSprint(config)

  return (
    <div className="developer-eval-module">
      <div className="eval-app">
        <header className="eval-topbar">
          <div>
            <p className="eval-eyebrow">Tech Team · Q2 FY 2026-27</p>
            <h1>Pactap Developer Evaluation Calculator</h1>
            <p className="eval-subtitle no-print">
              Change weightages, reward bands, and sprint inputs; calculations update live.
            </p>
          </div>
          <div className="eval-actions no-print">
            {(tab === 'simulator' || tab === 'sprints') && (
              <button type="button" className="eval-btn" onClick={() => window.print()}>
                Print evaluation
              </button>
            )}
            <button type="button" className="eval-btn ghost" onClick={resetConfig}>
              Reset to sheet defaults
            </button>
          </div>
        </header>

        <nav className="eval-tabs no-print" aria-label="Developer evaluation sections">
          {([
            ['parameters', '1. Parameters & Bands'],
            ['simulator', '2. Case Simulator'],
            ['sprints', '3. Multi-Sprint Eval'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'eval-tab active' : 'eval-tab'}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'parameters' && (
          <section className="eval-panel no-print">
            <div className="eval-panel-head">
              <h2>Sprint Evaluation Parameters</h2>
              <p>Allocated weightage should total 1.0. Points per sprint = Total Base Score ÷ No. of Sprints.</p>
            </div>
            <div className="eval-grid-2">
              <div className="eval-block">
                <h3>Weightages</h3>
                <table className="eval-data">
                  <thead><tr><th>Parameter</th><th>Weightage</th></tr></thead>
                  <tbody>
                    {PARAMETER_META.map(({ key, label }) => (
                      <tr key={key}>
                        <td>{label}</td>
                        <td><input className="num" type="number" step="0.01" min="0" max="1" value={config.weights[key]} onChange={(e) => setWeight(key, Number(e.target.value) || 0)} /></td>
                      </tr>
                    ))}
                    <tr className="eval-total-row">
                      <td>TOTAL</td>
                      <td className={Math.abs(weightTotal - 1) < 0.001 ? 'ok' : 'warn'}>
                        {formatNumber(weightTotal, 2)}{Math.abs(weightTotal - 1) >= 0.001 && ' (should be 1)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="eval-score-inputs">
                  <label>Total Base Score<input className="num" type="number" min="0" step="1" value={config.totalBaseScore} onChange={(e) => setBaseScore(Number(e.target.value) || 0)} /></label>
                  <label>No. of Sprints in Quarter<input className="num" type="number" min="1" step="1" value={config.sprintsInQuarter} onChange={(e) => setSprintsInQuarter(Math.max(1, Number(e.target.value) || 1))} /></label>
                  <div className="eval-readonly"><span>Points Per Sprint</span><strong>{formatNumber(pps, 2)}</strong></div>
                </div>
              </div>
              <div className="eval-block">
                <h3>Allocated points preview (per sprint)</h3>
                <table className="eval-data">
                  <thead><tr><th>Parameter</th><th>Weight</th><th>Allocated pts</th></tr></thead>
                  <tbody>{PARAMETER_META.map(({ key, label }) => (
                    <tr key={key}><td>{label}</td><td>{formatNumber(config.weights[key], 2)}</td><td>{formatNumber(pps * config.weights[key], 2)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div className="eval-bands-grid">
              {PARAMETER_META.map(({ key, label }) => (
                <div className="eval-block" key={key}>
                  <div className="eval-block-title"><h3>{label} · Reward bands</h3><button type="button" className="eval-btn small" onClick={() => addBand(key)}>+ Band</button></div>
                  <table className="eval-data compact">
                    <thead><tr><th>Band / Label</th><th>Multiplier</th><th /></tr></thead>
                    <tbody>{config.bands[key].map((row) => (
                      <tr key={row.id}>
                        <td><input type="text" value={row.label} onChange={(e) => updateBand(key, row.id, { label: e.target.value })} /></td>
                        <td><input className="num" type="number" step="0.01" value={row.multiplier} onChange={(e) => updateBand(key, row.id, { multiplier: Number(e.target.value) || 0 })} /></td>
                        <td><button type="button" className="eval-btn tiny danger" disabled={config.bands[key].length <= 1} onClick={() => removeBand(key, row.id)}>×</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'simulator' && (
          <section className="eval-panel print-area">
            <div className="eval-panel-head row">
              <div><p className="print-only print-doc-title">Sprint Evaluation Report</p><h2>Case Simulator</h2><p className="no-print">Achieved Points = Multiplier × Allocated Points. Net quarter score = Sprint Total × No. of Sprints.</p></div>
              <button type="button" className="eval-btn no-print" onClick={() => window.print()}>Print evaluation</button>
            </div>
            <div className="eval-kpi-row">
              <Kpi label="Total Base Score" value={formatNumber(config.totalBaseScore, 0)} />
              <Kpi label="Sprints in Quarter" value={String(config.sprintsInQuarter)} />
              <Kpi label="Points Per Sprint" value={formatNumber(pps, 2)} />
              <Kpi accent label="Sprint Total Achieved" value={formatNumber(simResult.totalAchieved)} />
              <Kpi accent label="Net Score in Quarter" value={formatNumber(netQuarterFromBenchmark(simResult.totalAchieved, config.sprintsInQuarter))} />
            </div>
            <table className="eval-data">
              <thead><tr><th>Parameters</th><th>Allocated Weightage</th><th>Allocated Points</th><th>Reward Band</th><th>Multiplier</th><th>Achieved Points</th></tr></thead>
              <tbody>
                {simResult.parameters.map((p) => (
                  <tr key={p.key}>
                    <td>{p.label}</td><td>{formatNumber(p.weightage, 2)}</td><td>{formatNumber(p.allocatedPoints)}</td>
                    <td><select className="no-print" value={simBands[p.key]} onChange={(e) => setSimBands((prev) => ({ ...prev, [p.key]: e.target.value }))}>{config.bands[p.key].map((b) => <option key={b.id} value={b.label}>{b.label}</option>)}</select><span className="print-only">{simBands[p.key]}</span></td>
                    <td>{p.multiplier === null ? '—' : formatNumber(p.multiplier)}</td><td className="mono">{formatNumber(p.achievedPoints)}</td>
                  </tr>
                ))}
                <tr className="eval-total-row"><td colSpan={5}>Total Achieved Points (for Sprint) (A + B + C + D)</td><td className="mono">{formatNumber(simResult.totalAchieved)}</td></tr>
              </tbody>
            </table>
            <p className="eval-note">* Assumes consistent performance across all sprints.</p>
          </section>
        )}

        {tab === 'sprints' && <MultiSprintPanel config={config} developers={developers} setDevelopers={setDevelopers} />}
      </div>
    </div>
  )
}

function Kpi({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={accent ? 'eval-kpi accent' : 'eval-kpi'}><span>{label}</span><strong>{value}</strong></div>
}

function MultiSprintPanel({ config, developers, setDevelopers }: {
  config: EvalConfig
  developers: DeveloperRecord[]
  setDevelopers: Dispatch<SetStateAction<DeveloperRecord[]>>
}) {
  const summary = useMemo(() => developers.map((dev) => {
    const sprintScores = dev.sprints.map((s) => ({ id: s.id, name: s.name, ...calculateSprint(config, s.bands) }))
    return { id: dev.id, name: dev.name, sprintScores, quarterTotal: sprintScores.reduce((sum, s) => sum + s.totalAchieved, 0) }
  }), [developers, config])

  const updateDeveloper = (id: string, update: (dev: DeveloperRecord) => DeveloperRecord) =>
    setDevelopers((prev) => prev.map((dev) => dev.id === id ? update(dev) : dev))

  return (
    <section className="eval-panel print-area">
      <div className="eval-panel-head row">
        <div><p className="print-only print-doc-title">Sprint Evaluation Report — Multi-Sprint</p><h2>Multi-Sprint Evaluation</h2><p className="no-print">Set reward bands per developer per sprint. Quarter total = sum of sprint achieved points.</p></div>
        <div className="eval-actions no-print"><button type="button" className="eval-btn" onClick={() => window.print()}>Print evaluation</button><button type="button" className="eval-btn ghost" onClick={() => setDevelopers((prev) => [...prev, newDeveloper(config)])}>+ Developer</button></div>
      </div>
      <div className="eval-summary-wrap">
        <h3>Quarter summary</h3>
        <table className="eval-data"><thead><tr><th>Developer</th>{(developers[0]?.sprints ?? []).map((s) => <th key={s.id}>{s.name}</th>)}<th>Total</th></tr></thead>
          <tbody>{summary.map((row) => <tr key={row.id}><td>{row.name}</td>{row.sprintScores.map((s) => <td key={s.id} className="mono">{formatNumber(s.totalAchieved)}</td>)}<td className="mono total-cell">{formatNumber(row.quarterTotal)}</td></tr>)}</tbody>
        </table>
      </div>
      {developers.map((dev, devIndex) => (
        <div className="eval-dev-card" key={dev.id}>
          <div className="eval-dev-head">
            <input className="eval-dev-name no-print" value={dev.name} onChange={(e) => updateDeveloper(dev.id, (d) => ({ ...d, name: e.target.value }))} />
            <h3 className="print-only">{dev.name}</h3>
            <div className="eval-actions no-print"><button type="button" className="eval-btn small" onClick={() => updateDeveloper(dev.id, (d) => ({ ...d, sprints: [...d.sprints, newSprint(d.sprints.length + 1, config)] }))}>+ Sprint</button><button type="button" className="eval-btn small danger" disabled={developers.length <= 1} onClick={() => setDevelopers((prev) => prev.filter((d) => d.id !== dev.id))}>Remove</button></div>
          </div>
          <div className="eval-sprint-scroll"><table className="eval-data compact">
            <thead><tr><th>Parameter</th>{dev.sprints.map((s, si) => <th key={s.id}><div className="eval-sprint-head"><input className="eval-sprint-name no-print" value={s.name} onChange={(e) => updateDeveloper(dev.id, (d) => ({ ...d, sprints: d.sprints.map((sp, i) => i === si ? { ...sp, name: e.target.value } : sp) }))} /><span className="print-only">{s.name}</span>{dev.sprints.length > 1 && <button type="button" className="eval-btn tiny danger no-print" onClick={() => updateDeveloper(dev.id, (d) => ({ ...d, sprints: d.sprints.filter((_, i) => i !== si) }))}>×</button>}</div></th>)}</tr></thead>
            <tbody>
              {PARAMETER_META.map(({ key, short }) => <tr key={key}><td>{short}</td>{dev.sprints.map((s, si) => <td key={s.id}><select className="no-print" value={s.bands[key]} onChange={(e) => updateDeveloper(dev.id, (d) => ({ ...d, sprints: d.sprints.map((sp, i) => i === si ? { ...sp, bands: { ...sp.bands, [key]: e.target.value } } : sp) }))}>{config.bands[key].map((b) => <option key={b.id} value={b.label}>{b.label}</option>)}</select><span className="print-only">{s.bands[key]}</span></td>)}</tr>)}
              <tr className="eval-total-row"><td>Sprint Total</td>{summary[devIndex]?.sprintScores.map((s) => <td key={s.id} className="mono">{formatNumber(s.totalAchieved)}</td>)}</tr>
              <tr><td>Breakdown (pts)</td>{summary[devIndex]?.sprintScores.map((s) => <td key={s.id} className="eval-breakdown">{s.parameters.map((p) => <div key={p.key}>{PARAMETER_META.find((m) => m.key === p.key)?.short}: {formatNumber(p.achievedPoints)}</div>)}</td>)}</tr>
            </tbody>
          </table></div>
        </div>
      ))}
    </section>
  )
}
