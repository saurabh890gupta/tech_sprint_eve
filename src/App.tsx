import { useEffect, useMemo, useState } from 'react'
import type { AppState, Developer, DocRating, Goal, QuarterConfig } from './types'
import {
  calculateScores,
  formatNumber,
  DOC_RATING_WEIGHTS,
  HOURS_PER_DAY,
  uid,
} from './calculations'
import { createDefaultState, STORAGE_KEY } from './data/defaults'

const DOC_OPTIONS = Object.keys(DOC_RATING_WEIGHTS) as DocRating[]

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    return { ...createDefaultState(), ...JSON.parse(raw) } as AppState
  } catch {
    return createDefaultState()
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const scores = useMemo(
    () =>
      calculateScores(
        state.quarter,
        state.developers,
        state.goals,
      ),
    [state],
  )

  function updateQuarter(patch: Partial<QuarterConfig>) {
    setState((s) => ({ ...s, quarter: { ...s.quarter, ...patch } }))
  }

  function updateDeveloper(id: string, patch: Partial<Developer>) {
    setState((s) => ({
      ...s,
      developers: s.developers.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }))
  }

  function addDeveloper() {
    setState((s) => ({
      ...s,
      developers: [
        ...s.developers,
        {
          id: uid(),
          name: '',
          daysInQuarter: s.quarter.workingDays,
          leaveDays: 0,
        },
      ],
    }))
  }

  function removeDeveloper(id: string) {
    setState((s) => ({
      ...s,
      developers: s.developers.filter((d) => d.id !== id),
    }))
  }

  function updateGoal(id: string, patch: Partial<Goal>) {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }))
  }

  function addGoal() {
    setState((s) => ({
      ...s,
      goals: [
        ...s.goals,
        {
          id: uid(),
          name: '',
          plannedHours: 0,
          staging: false,
          production: false,
          documentation: 'None',
          notes: '',
        },
      ],
    }))
  }

  function removeGoal(id: string) {
    setState((s) => ({
      ...s,
      goals: s.goals.filter((g) => g.id !== id),
    }))
  }

  function resetAll() {
    if (window.confirm('Reset to Q2 sample data? Unsaved edits will be lost.')) {
      localStorage.removeItem(STORAGE_KEY)
      setState(createDefaultState())
    }
  }

  function handlePrint() {
    document.body.classList.add('printing')
    window.print()
    // Some browsers fire afterprint late; clear on next frame too
    const clear = () => document.body.classList.remove('printing')
    window.addEventListener('afterprint', clear, { once: true })
    setTimeout(clear, 1000)
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-kicker">Tech Team · Product + Engineering</div>
        <h1>Quarter Goals Calculator</h1>
        <p className="no-print">
          Enter developers, planned hours per KPI, staging / production status, and
          documentation rating. Scores follow the Engineering sheet formulas —
          including Acquired Score = (Planned ÷ Productive) × 120.
        </p>
        <p className="print-only print-meta">
          {state.quarter.label} · {state.quarter.fiscalYear} · Printed{' '}
          {new Date().toLocaleDateString()}
        </p>
        <div className="hero-actions no-print">
          <button type="button" className="btn btn-primary" onClick={addGoal}>
            Add KPI / Goal
          </button>
          <button type="button" className="btn btn-ghost" onClick={addDeveloper}>
            Add Developer
          </button>
          <button type="button" className="btn btn-ghost" onClick={handlePrint}>
            Print preview
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetAll}>
            Reset sample
          </button>
        </div>
      </header>

      <div className="layout">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Quarter setup</h2>
                <p>Working days and hours drive each developer’s productive capacity.</p>
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="q-label">Quarter</label>
                <input
                  id="q-label"
                  value={state.quarter.label}
                  onChange={(e) => updateQuarter({ label: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="q-fy">Fiscal year</label>
                <input
                  id="q-fy"
                  value={state.quarter.fiscalYear}
                  onChange={(e) => updateQuarter({ fiscalYear: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="q-days">Working days in quarter</label>
                <input
                  id="q-days"
                  type="number"
                  min={0}
                  value={state.quarter.workingDays}
                  onChange={(e) =>
                    updateQuarter({ workingDays: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field">
                <label>Hours per day (fixed)</label>
                <input type="number" value={HOURS_PER_DAY} disabled readOnly />
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Developers</h2>
                <p>
                  Productive hours = Present × {HOURS_PER_DAY}. Present = (days − leaves).
                  Weekends &amp; holidays should already be excluded from days. Half-days
                  allowed (e.g. 0.5 leave).
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={addDeveloper}>
                Add
              </button>
            </div>

            {state.developers.length === 0 ? (
              <div className="empty">No developers yet. Add at least one.</div>
            ) : (
              <div className="table-wrap">
                <table className="developers-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Days in quarter</th>
                      <th>Leaves</th>
                      <th>Present</th>
                      <th>Productive hrs</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {state.developers.map((dev) => {
                      const row = scores.developerHours.find((h) => h.id === dev.id)
                      return (
                        <tr key={dev.id}>
                          <td>
                            <input
                              type="text"
                              placeholder="Developer name"
                              value={dev.name}
                              onChange={(e) =>
                                updateDeveloper(dev.id, { name: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={dev.daysInQuarter}
                              onChange={(e) =>
                                updateDeveloper(dev.id, {
                                  daysInQuarter: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={dev.leaveDays}
                              onChange={(e) =>
                                updateDeveloper(dev.id, {
                                  leaveDays: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="num">
                            {formatNumber(row?.presentDays ?? 0, 1)}
                          </td>
                          <td className="num">
                            {formatNumber(row?.hours ?? 0, 1)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => removeDeveloper(dev.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="totals-row">
                      <td>
                        <strong>Total</strong>
                      </td>
                      <td className="num">
                        <strong>
                          {formatNumber(
                            state.developers.reduce(
                              (s, d) => s + (Number(d.daysInQuarter) || 0),
                              0,
                            ),
                            1,
                          )}
                        </strong>
                      </td>
                      <td className="num">
                        <strong>
                          {formatNumber(
                            state.developers.reduce(
                              (s, d) => s + (Number(d.leaveDays) || 0),
                              0,
                            ),
                            1,
                          )}
                        </strong>
                      </td>
                      <td className="num">
                        <strong>{formatNumber(scores.totalPresentDays, 1)}</strong>
                      </td>
                      <td className="num">
                        <strong>
                          {formatNumber(scores.actualDevelopmentHours, 1)}
                        </strong>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {state.developers.length > 0 && (
              <div className="final-total" style={{ marginTop: '1rem' }}>
                <div className="final-total-item">
                  <span className="label">Total days in quarter</span>
                  <span className="value">
                    {formatNumber(
                      state.developers.reduce(
                        (s, d) => s + (Number(d.daysInQuarter) || 0),
                        0,
                      ),
                      1,
                    )}
                  </span>
                </div>
                <div className="final-total-item">
                  <span className="label">Total leaves</span>
                  <span className="value">
                    {formatNumber(
                      state.developers.reduce(
                        (s, d) => s + (Number(d.leaveDays) || 0),
                        0,
                      ),
                      1,
                    )}
                  </span>
                </div>
                <div className="final-total-item accent">
                  <span className="label">Final present days</span>
                  <span className="value">
                    {formatNumber(scores.totalPresentDays, 1)}
                  </span>
                </div>
                <div className="final-total-item">
                  <span className="label">Total productive hrs</span>
                  <span className="value">
                    {formatNumber(scores.actualDevelopmentHours, 1)}
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>KPIs / Goals</h2>
                <p>
                  Enter each goal’s planned hours, staging / production status, and
                  documentation rating. Scores update automatically from the formulas below.
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={addGoal}>
                Add goal
              </button>
            </div>

            <div className="formula-box no-print" style={{ marginBottom: '1rem' }}>
              <h3>Overall logic &amp; formulas</h3>
              <ol>
                <li>
                  <strong>Productive hours (per developer)</strong> →{' '}
                  <code>(Days in quarter − Leaves) × {HOURS_PER_DAY}</code>
                </li>
                <li>
                  <strong>Total Productive Hours</strong> → sum of all developers’
                  productive hours
                </li>
                <li>
                  <strong>Projected Hours</strong> → sum of all KPI Planned Hrs
                </li>
                <li>
                  <strong>Acquired Score (overall)</strong> →{' '}
                  <code>(Total Planned Hours ÷ Total Productive Hours) × 120</code>
                </li>
                <li>
                  <strong>Achievable (per KPI)</strong> →{' '}
                  <code>((Planned Hrs ÷ Total Productive) × 120) × Deployment %</code>
                  <br />
                  Deployment: neither = <strong>0%</strong>, Staging only ={' '}
                  <strong>50%</strong>, Staging + Production = <strong>100%</strong>
                  <br />
                  Selecting Production auto-checks Staging.
                </li>
                <li>
                  <strong>Document (per KPI)</strong> →{' '}
                  <code>Achievable × (1 + Doc %)</code> (documentation only)
                </li>
                <li>
                  <strong>Staging / Production</strong> → change Achievable only (not
                  Document’s doc formula)
                </li>
              </ol>
              <h3 style={{ marginTop: '0.75rem' }}>Documentation rating %</h3>
              <ul
                style={{
                  margin: '0.35rem 0 0',
                  paddingLeft: '1.15rem',
                  color: 'var(--ink-soft)',
                  fontSize: '0.84rem',
                  lineHeight: 1.55,
                  display: 'grid',
                  gap: '0.2rem',
                }}
              >
                <li>
                  Excellent = <strong>25%</strong>
                </li>
                <li>
                  Good = <strong>20%</strong>
                </li>
                <li>
                  Satisfactory = <strong>15%</strong>
                </li>
                <li>
                  Unsatisfactory = <strong>10%</strong>
                </li>
                <li>
                  Poor = <strong>5%</strong>
                </li>
                <li>
                  None = <strong>0%</strong>
                </li>
              </ul>
              <p
                style={{
                  marginTop: '0.65rem',
                  fontSize: '0.84rem',
                  color: 'var(--ink-soft)',
                  lineHeight: 1.45,
                }}
              >
                Example: Planned 150, Productive 1500 → base ={' '}
                <code>150/1500 × 120 = 12</code>. Staging only → Achievable ={' '}
                <code>12 × 50% = 6</code>. Production (auto Staging) → Achievable ={' '}
                <code>12 × 100% = 12</code>. Doc Good (20%) → Document ={' '}
                <code>12 × 1.20 = 14.4</code>.
              </p>
            </div>

            {state.goals.length === 0 ? (
              <div className="empty">No goals yet. Add KPIs for this quarter.</div>
            ) : (
              <div className="table-wrap">
                <table className="goals-table">
                  <thead>
                    <tr>
                      <th className="col-num">#</th>
                      <th className="col-kpi">KPI</th>
                      <th className="col-hrs">Planned hrs</th>
                      <th className="col-check">Staging</th>
                      <th className="col-check">Production</th>
                      <th className="col-doc">Doc rating</th>
                      <th className="col-score">Achievable</th>
                      <th className="col-score">Document</th>
                      <th className="col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {state.goals.map((goal, index) => {
                      const gs = scores.goalScores.find((g) => g.id === goal.id)
                      return (
                        <tr key={goal.id}>
                          <td className="col-num num">{index + 1}</td>
                          <td className="col-kpi">
                            <input
                              type="text"
                              placeholder="Goal / KPI name"
                              value={goal.name}
                              onChange={(e) =>
                                updateGoal(goal.id, { name: e.target.value })
                              }
                            />
                          </td>
                          <td className="col-hrs">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={goal.plannedHours}
                              onChange={(e) =>
                                updateGoal(goal.id, {
                                  plannedHours: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="col-check">
                            <input
                              type="checkbox"
                              checked={goal.staging}
                              onChange={(e) => {
                                const staging = e.target.checked
                                updateGoal(goal.id, {
                                  staging,
                                  production: staging ? goal.production : false,
                                })
                              }}
                              aria-label="Deployed on staging"
                            />
                            <span className="print-only">{goal.staging ? 'Yes' : 'No'}</span>
                          </td>
                          <td className="col-check">
                            <input
                              type="checkbox"
                              checked={goal.production}
                              onChange={(e) => {
                                const production = e.target.checked
                                updateGoal(goal.id, {
                                  production,
                                  staging: production ? true : goal.staging,
                                })
                              }}
                              aria-label="Deployed on production"
                            />
                            <span className="print-only">
                              {goal.production ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="col-doc">
                            <select
                              className="screen-only"
                              value={goal.documentation}
                              onChange={(e) =>
                                updateGoal(goal.id, {
                                  documentation: e.target.value as DocRating,
                                })
                              }
                            >
                              {DOC_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <span className="print-only">{goal.documentation}</span>
                          </td>
                          <td className="col-score num">
                            {formatNumber(gs?.achievablePoints ?? 0)}
                          </td>
                          <td className="col-score num">
                            {formatNumber(gs?.achievedPoints ?? 0)}
                          </td>
                          <td className="col-action">
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => removeGoal(goal.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="totals-row">
                      <td className="col-num" />
                      <td className="col-kpi">
                        <strong>Total</strong>
                      </td>
                      <td className="col-hrs num">
                        <strong>{formatNumber(scores.projectedHours, 0)}</strong>
                      </td>
                      <td className="col-check" />
                      <td className="col-check" />
                      <td className="col-doc" />
                      <td className="col-score num">
                        <strong>{formatNumber(scores.totalAchievablePoints)}</strong>
                      </td>
                      <td className="col-score num">
                        <strong>{formatNumber(scores.totalAchievedPoints)}</strong>
                      </td>
                      <td className="col-action" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {state.goals.length > 0 && (
              <div className="final-total">
                <div className="final-total-item">
                  <span className="label">Total planned hrs</span>
                  <span className="value">
                    {formatNumber(scores.projectedHours, 0)}
                  </span>
                </div>
                <div className="final-total-item">
                  <span className="label">Total productive hrs</span>
                  <span className="value">
                    {formatNumber(scores.actualDevelopmentHours, 1)}
                  </span>
                </div>
                <div className="final-total-item">
                  <span className="label">Total achievable</span>
                  <span className="value">
                    {formatNumber(scores.totalAchievablePoints)}
                  </span>
                </div>
                <div className="final-total-item">
                  <span className="label">Acquired score</span>
                  <span className="value">{formatNumber(scores.acquiredScore)}</span>
                </div>
                <div className="final-total-item accent">
                  <span className="label">Final total (Document)</span>
                  <span className="value">
                    {formatNumber(scores.totalAchievedPoints)}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="stack sticky-summary">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Score summary</h2>
                <p>
                  {state.quarter.label} · {state.quarter.fiscalYear}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary no-print"
                onClick={handlePrint}
              >
                Print preview
              </button>
            </div>

            <div className="summary-grid">
              <div className="metric">
                <div className="label">Projected hours</div>
                <div className="value">{formatNumber(scores.projectedHours, 1)}</div>
                <div className="hint">
                  Total planned hours across all KPIs for the quarter.
                </div>
              </div>

              <div className="metric">
                <div className="label">Actual development hours</div>
                <div className="value">
                  {formatNumber(scores.actualDevelopmentHours, 1)}
                </div>
                <div className="hint">
                  Σ (days − leaves) × {HOURS_PER_DAY} hrs across all developers.
                </div>
              </div>

              <div className="metric accent">
                <div className="label">Acquired score</div>
                <div className="value">{formatNumber(scores.acquiredScore)}</div>
                <div className="hint">
                  (Projected ÷ Actual) × 120 = ({formatNumber(scores.projectedHours, 1)} ÷{' '}
                  {formatNumber(scores.actualDevelopmentHours, 1)}) × 120
                </div>
              </div>

              <div className="metric">
                <div className="label">Delivery-adjusted score</div>
                <div className="value">
                  {formatNumber(scores.deliveryAdjustedScore)}
                </div>
                <div className="hint">
                  Sum of Document (Achievable × Doc bonus). Avg deployment{' '}
                  {formatNumber(scores.averageGoalCompletion, 1)}%.
                </div>
                <div className="progress" style={{ marginTop: '0.55rem' }}>
                  <span
                    style={{
                      width: `${Math.min(100, scores.averageGoalCompletion)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="metric">
                <div className="label">KPI points (document / pool)</div>
                <div className="value">
                  {formatNumber(scores.totalAchievedPoints)}{' '}
                  <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>
                    / {formatNumber(scores.totalAchievablePoints)}
                  </span>
                </div>
                <div className="hint">
                  Achievable uses Deployment 0/50/100%. Document adds Doc % only.
                </div>
              </div>
            </div>

            <div className="chip-row">
              <span className="chip">{state.developers.length} developers</span>
              <span className="chip">{state.goals.length} KPIs</span>
              <span className="chip">
                {formatNumber(scores.projectedHours, 0)} planned hrs
              </span>
            </div>

            <div className="goal-scores">
              {scores.goalScores.map((g) => (
                <div className="goal-score-row" key={g.id}>
                  <div>
                    <div className="name">{g.name || 'Untitled goal'}</div>
                    <div className="meta">
                      {formatNumber(g.plannedHours, 0)} hrs · achievable{' '}
                      {formatNumber(g.completionPercent, 0)}%
                      {g.docWeight > 0
                        ? ` · doc +${(g.docWeight * 100).toFixed(0)}%`
                        : ''}
                    </div>
                    <div className="progress" style={{ marginTop: '0.4rem' }}>
                      <span style={{ width: `${Math.min(100, g.completionPercent)}%` }} />
                    </div>
                  </div>
                  <div className="num" style={{ textAlign: 'right' }}>
                    <div>{formatNumber(g.achievedPoints)}</div>
                    <div className="meta">of {formatNumber(g.achievablePoints)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="formula-box no-print">
              <h3>Sheet formulas (summary)</h3>
              <ol>
                <li>
                  <strong>Productive hrs</strong> →{' '}
                  <code>(Days − Leaves) × {HOURS_PER_DAY}</code>
                </li>
                <li>
                  <strong>Acquired Score</strong> →{' '}
                  <code>(Total Planned ÷ Total Productive) × 120</code>
                </li>
                <li>
                  <strong>Achievable</strong> →{' '}
                  <code>((Planned ÷ Productive) × 120) × Deployment %</code>
                  <br />
                  Deployment: none 0% · Staging only 50% · both 100% (Production auto-checks
                  Staging)
                </li>
                <li>
                  <strong>Document</strong> → <code>Achievable × (1 + Doc %)</code>
                </li>
                <li>
                  <strong>Doc %</strong> → Excellent 25% · Good 20% · Satisfactory 15% ·
                  Unsatisfactory 10% · Poor 5% · None 0%
                </li>
              </ol>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
