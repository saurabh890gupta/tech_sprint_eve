import { useEffect, useState } from 'react'
import GoalsCalculator from './App'
import DeveloperEvaluationModule from './modules/developer-evaluation/DeveloperEvaluationModule'
import MarginAgentModule from './modules/margin-agent/MarginAgentModule'
import PliPolicyModule from './modules/pli-policy/PliPolicyModule'
import './application-shell.css'

type ModuleId = 'goals' | 'developer-evaluation' | 'pli-policy' | 'margin-agent'

const MODULES: { id: ModuleId; title: string; description: string }[] = [
  {
    id: 'goals',
    title: 'Quarter Goals',
    description: 'Plan team capacity, KPI hours, deployment, and documentation scores.',
  },
  {
    id: 'developer-evaluation',
    title: 'Developer Evaluation',
    description: 'Configure evaluation bands, simulate a case, and score multiple sprints.',
  },
  {
    id: 'pli-policy',
    title: 'PLI Policy',
    description: 'Calculate quarterly incentives, payouts, perquisites, and promotion progress.',
  },
  {
    id: 'margin-agent',
    title: 'Margin Agent',
    description: 'Calculate FOB or delivered margins and manage saved customer quotes.',
  },
]

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '')

function isModuleId(value: string): value is ModuleId {
  return MODULES.some((module) => module.id === value)
}

function pathForModule(id: ModuleId): string {
  return `${BASE_PATH}/${id}`
}

function moduleFromLocation(): ModuleId {
  const legacyHash = window.location.hash.replace(/^#\/?/, '')
  if (isModuleId(legacyHash)) return legacyHash
  const segment = window.location.pathname
    .slice(BASE_PATH.length)
    .replace(/^\/+|\/+$/g, '')
  return isModuleId(segment) ? segment : 'goals'
}

export default function ApplicationShell() {
  const [activeModule, setActiveModule] = useState<ModuleId>(moduleFromLocation)

  useEffect(() => {
    // Rewrite any legacy "#module" link to its clean path without adding history.
    if (window.location.hash) {
      window.history.replaceState(null, '', pathForModule(moduleFromLocation()))
    }
    const handlePopState = () => setActiveModule(moduleFromLocation())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function selectModule(id: ModuleId) {
    setActiveModule(id)
    window.history.pushState(null, '', pathForModule(id))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <header className="app-shell-header no-print">
        <div className="app-shell-brand">
          <span className="app-shell-mark" aria-hidden="true">TG</span>
          <div>
            <strong>Tech Goals Suite</strong>
            <span>Planning and evaluation workspace</span>
          </div>
        </div>
        <nav className="app-shell-nav" aria-label="Application modules">
          {MODULES.map((module) => (
            <button
              key={module.id}
              type="button"
              className={activeModule === module.id ? 'active' : ''}
              aria-current={activeModule === module.id ? 'page' : undefined}
              onClick={() => selectModule(module.id)}
            >
              <strong>{module.title}</strong>
              <span>{module.description}</span>
            </button>
          ))}
        </nav>
      </header>
      <main>
        {activeModule === 'goals' && <GoalsCalculator />}
        {activeModule === 'developer-evaluation' && <DeveloperEvaluationModule />}
        {activeModule === 'pli-policy' && <PliPolicyModule />}
        {activeModule === 'margin-agent' && <MarginAgentModule />}
      </main>
    </>
  )
}
