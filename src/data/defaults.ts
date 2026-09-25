import type { AppState } from '../types'
import { uid } from '../calculations'

/** Seeded from Saurabh + Engineering Department Q2 Goals sheet */
export function createDefaultState(): AppState {
  return {
    quarter: {
      label: 'Q2 (July – September)',
      fiscalYear: 'FY 2026-27',
      workingDays: 66,
    },
    developers: [
      {
        id: uid(),
        name: 'Sushanta Bhowmick',
        daysInQuarter: 66,
        leaveDays: 0.5,
      },
      {
        id: uid(),
        name: 'Nayan Shukla',
        daysInQuarter: 66,
        leaveDays: 11,
      },
      {
        id: uid(),
        name: 'Pralipta Swain',
        daysInQuarter: 66,
        leaveDays: 4.5,
      },
      {
        id: uid(),
        name: 'Nishtha Singh',
        daysInQuarter: 66,
        leaveDays: 4,
      },
    ],
    goals: [
      {
        id: uid(),
        name: 'Order Cart Consolidation (FOB & DELIVERED)',
        plannedHours: 200,
        staging: true,
        production: false,
        documentation: 'Satisfactory',
        notes: '',
      },
      {
        id: uid(),
        name: 'Comparison Matrix Consolidation (FOB & DELIVERED)',
        plannedHours: 160,
        staging: true,
        production: false,
        documentation: 'Satisfactory',
        notes: '',
      },
      {
        id: uid(),
        name: 'Logistics LCL Capabilities (Buyer Panel)',
        plannedHours: 180,
        staging: false,
        production: false,
        documentation: 'None',
        notes: '',
      },
      {
        id: uid(),
        name: 'Advanced Order Management (v2)',
        plannedHours: 240,
        staging: true,
        production: true,
        documentation: 'Good',
        notes: '',
      },
      {
        id: uid(),
        name: 'Revamp User Roles & Permission – Admin Panel',
        plannedHours: 120,
        staging: true,
        production: false,
        documentation: 'Satisfactory',
        notes: '',
      },
      {
        id: uid(),
        name: 'API Integration for Advanced Taxes & Duties (v2)',
        plannedHours: 100,
        staging: true,
        production: true,
        documentation: 'Good',
        notes: '',
      },
      {
        id: uid(),
        name: 'API Integration for Advanced Logistics (v2)',
        plannedHours: 100,
        staging: true,
        production: true,
        documentation: 'Good',
        notes: '',
      },
      {
        id: uid(),
        name: 'Messaging Service (User Support)',
        plannedHours: 150,
        staging: false,
        production: false,
        documentation: 'None',
        notes: '',
      },
      {
        id: uid(),
        name: 'Activity Log (Buyer & Supplier on Admin)',
        plannedHours: 80,
        staging: false,
        production: false,
        documentation: 'None',
        notes: '',
      },
      {
        id: uid(),
        name: 'Backend Improvements (Pallet Currency, Quote & Leads API)',
        plannedHours: 90,
        staging: true,
        production: true,
        documentation: 'Excellent',
        notes: '',
      },
    ],
  }
}

export const STORAGE_KEY = 'tech-goals-calculator-v3'
