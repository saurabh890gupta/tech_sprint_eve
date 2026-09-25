import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ApplicationShell from './ApplicationShell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApplicationShell />
  </StrictMode>,
)
