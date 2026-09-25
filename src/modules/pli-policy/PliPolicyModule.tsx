import { useMemo, useState } from 'react'
import './pli-policy.css'

type GradeKey = 'E' | 'M12' | 'M345' | 'M678' | 'M910'
type FormState = {
  ctc: number
  grade: GradeKey
  company: number
  payq: number
  ratings: [number, number, number, number]
}

const DEFAULTS: FormState = { ctc: 600000, grade: 'E', company: 1, payq: 1, ratings: [2, 3, 1, 0] }
const INITIAL_STATE: FormState = { ...DEFAULTS, payq: 0 }
const RATING: Record<number, string> = { [-2]: 'Poor', 0: 'Unsatisfactory', 1: 'Satisfactory', 2: 'Good', 3: 'Excellent' }
const BASE_PAY: Record<number, number> = { [-2]: 0, 0: 0, 1: .05, 2: .1, 3: .15 }
const GRADES = {
  E: { mult: 1.5, label: 'E1–E3', points: 6, quarters: 6 },
  M12: { mult: 1.25, label: 'M1–M2', points: 8, quarters: 8 },
  M345: { mult: 1.1, label: 'M3–M5', points: 10, quarters: 8 },
  M678: { mult: 1, label: 'M6–M8', points: 14, quarters: 12 },
  M910: { mult: 1, label: 'M9–M10', points: 16, quarters: 12 },
}
const PAYOUT = [['July', 'October'], ['October', 'January'], ['January', 'April'], ['April', 'July']]
const RATING_OPTIONS = [-2, 0, 1, 2, 3]
const money = (n: number) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))}`
const pct = (n: number) => `${Math.round(n * 100)}%`

function pointsMultiplier(points: number) {
  if (points <= 2) return 1
  if (points <= 4) return 1.2
  if (points <= 6) return 1.4
  if (points <= 9) return 1.7
  return 2
}

function perksFor(points: number) {
  if (points >= 10) return ['Hybrid mode, with at least 3 days from office each week']
  if (points >= 7) return ['2 extra short leaves a month', '2 work from home days a month', 'Flexible timings']
  if (points >= 5) return ['2 extra short leaves a month', '2 work from home days a month']
  if (points >= 3) return ['2 extra short leaves a month']
  return []
}

export default function PliPolicyModule() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const result = useMemo(() => {
    const quarterlyCtc = Math.max(0, form.ctc || 0) / 4
    const points = form.ratings.reduce((sum, value) => sum + value, 0)
    const base = BASE_PAY[form.ratings[0]]
    const cumulative = pointsMultiplier(points)
    const grade = GRADES[form.grade]
    const amount = quarterlyCtc * base * cumulative * form.company * grade.mult
    return { quarterlyCtc, points, base, cumulative, grade, amount, perks: perksFor(points) }
  }, [form])
  const signedPoints = `${result.points > 0 ? '+' : ''}${result.points}`
  const months = PAYOUT[form.payq]
  const setRating = (index: number, value: number) =>
    setForm((current) => ({ ...current, ratings: current.ratings.map((rating, i) => i === index ? value : rating) as FormState['ratings'] }))

  return (
    <div className="pli-module">
      <div className="pli-wrap">
        <header className="pli-header">
          <div><p className="pli-eyebrow">Performance Excellence Program</p><h1>PLI calculator</h1><p className="pli-sub">Aero Business Solutions Pvt Ltd · quarterly Performance Linked Incentive</p></div>
          <p className="pli-effective">policy effective<br />23 April 2026</p>
        </header>

        <section className="pli-strip">
          <p className="pli-eyebrow">Quarterly CTC × base pay × points × company × grade</p>
          <div className="pli-chain">
            {[['Quarterly CTC', money(result.quarterlyCtc)], ['Base pay', pct(result.base)], ['Points', pct(result.cumulative)], ['Company', pct(form.company)], ['Grade', pct(result.grade.mult)]].map(([label, value], index) => (
              <div className="pli-chain-item" key={label}>{index > 0 && <span className="pli-op">×</span>}<div className="pli-term"><span>{label}</span><strong>{value}</strong></div></div>
            ))}
          </div>
          <div className="pli-total"><strong>{money(result.amount)}</strong><span>{result.quarterlyCtc > 0 ? `${(result.amount / result.quarterlyCtc * 100).toFixed(1)}% of quarterly CTC, ${(form.ctc > 0 ? result.amount / form.ctc * 100 : 0).toFixed(1)}% of annual` : ''}</span></div>
        </section>

        <div className={result.base > 0 ? 'pli-notice ok' : 'pli-notice stop'}>
          {result.base > 0 ? `Eligible. Current rating ${RATING[form.ratings[0]]} gives a base pay of ${pct(result.base)}.` : `Not eligible this quarter. A current rating of ${RATING[form.ratings[0]]} carries 0% base pay, and the policy requires satisfactory or above.`}
        </div>

        <section className="pli-card">
          <p className="pli-eyebrow">Your details</p>
          <div className="pli-fields">
            <Field label="Annual CTC (₹)"><input type="number" step="10000" min="0" value={form.ctc} onChange={(e) => setForm({ ...form, ctc: Number(e.target.value) })} /></Field>
            <Field label="Grade"><select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value as GradeKey })}>{Object.entries(GRADES).map(([key, grade]) => <option key={key} value={key}>{grade.label} — {pct(grade.mult)}</option>)}</select></Field>
            <Field label="Company rating"><select value={form.company} onChange={(e) => setForm({ ...form, company: Number(e.target.value) })}><option value=".5">Poor — 50%</option><option value=".8">Unsatisfactory — 80%</option><option value="1">Satisfactory — 100%</option><option value="1.1">Good — 110%</option><option value="1.3">Excellent — 130%</option></select></Field>
            <Field label="Quarter being paid"><select value={form.payq} onChange={(e) => setForm({ ...form, payq: Number(e.target.value) })}><option value="0">Q1 — Apr to Jun</option><option value="1">Q2 — Jul to Sep</option><option value="2">Q3 — Oct to Dec</option><option value="3">Q4 — Jan to Mar</option></select></Field>
          </div>
        </section>

        <section className="pli-card">
          <p className="pli-eyebrow">Ratings — current quarter and the previous three</p>
          <div className="pli-fields">
            {['Current quarter', 'Last quarter', '2 quarters ago', '3 quarters ago'].map((label, index) => <Field key={label} label={label}><select className={index === 0 ? 'current' : ''} value={form.ratings[index]} onChange={(e) => setRating(index, Number(e.target.value))}>{RATING_OPTIONS.map((value) => <option key={value} value={value}>{RATING[value]}</option>)}</select></Field>)}
          </div>
          <p className="pli-points">Cumulative rating points <strong>{signedPoints}</strong> <span>→ {pct(result.cumulative)} multiplier</span></p>
        </section>

        <div className="pli-grid">
          <section className="pli-card"><p className="pli-eyebrow">Working</p><table><tbody>
            <Work label="Quarterly CTC" value={money(result.quarterlyCtc)} /><Work label="Base pay percentage" value={`${RATING[form.ratings[0]]}, ${pct(result.base)}`} /><Work label="Cumulative points multiplier" value={`${signedPoints} points, ${pct(result.cumulative)}`} /><Work label="Company rating multiplier" value={pct(form.company)} /><Work label="Grade multiplier" value={`${result.grade.label}, ${pct(result.grade.mult)}`} /><Work label="PLI for the quarter" value={money(result.amount)} total />
          </tbody></table></section>
          <section className="pli-card"><p className="pli-eyebrow">Payout schedule</p><div className="pli-split">{months.map((month) => <div key={month}><span>{month} salary</span><strong>{money(result.amount / 2)}</strong></div>)}</div></section>
          <section className="pli-card"><p className="pli-eyebrow">Perquisites at this point level</p><ul className="pli-perks">{result.perks.length ? result.perks.map((perk) => <li key={perk}>{perk}</li>) : <li className="none">Nothing unlocked yet. Perquisites start at +3 points.</li>}</ul></section>
          <section className="pli-card"><p className="pli-eyebrow">Promotion track</p><p>{signedPoints} of the +{result.grade.points} points needed at grade {result.grade.label}.</p><div className="pli-bar"><span style={{ width: `${Math.min(100, Math.max(0, result.points) / result.grade.points * 100)}%` }} /></div><p className="pli-hint">{Math.max(0, result.points) >= result.grade.points ? `Threshold met on these four quarters. The policy allows ${result.grade.quarters} quarters to reach it.` : `${result.grade.points - Math.max(0, result.points)} more to go, within a window of ${result.grade.quarters} quarters.`}</p></section>
        </div>
        <div className="pli-actions no-print"><button type="button" onClick={() => window.print()}>Print this calculation</button><button type="button" onClick={() => setForm(DEFAULTS)}>Reset to policy example</button></div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="pli-field"><span>{label}</span>{children}</label> }
function Work({ label, value, total = false }: { label: string; value: string; total?: boolean }) { return <tr className={total ? 'total' : ''}><td>{label}</td><td>{value}</td></tr> }
