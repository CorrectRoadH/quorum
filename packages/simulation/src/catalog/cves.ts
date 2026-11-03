/* CVEs (GDD 18): vulnerabilities in software a Design runs. All fictional. */

import type { ComponentId } from './components.ts'

export type CveDef = Readonly<{
  id: string
  /** 1 to 10. A higher score means a smaller window and a bigger patch. */
  score: number
  /** The Components that run the affected software. A Design without one is not exposed. */
  affects: ReadonlyArray<ComponentId>
}>

export const CVE_DEFS: ReadonlyArray<CveDef> = [
  { id: 'CVE-2026-1337', score: 9.8, affects: ['lb', 'cdn', 'waf'] },
  { id: 'CVE-2026-0451', score: 7.5, affects: ['server'] },
  { id: 'CVE-2026-2718', score: 8.1, affects: ['database'] },
  { id: 'CVE-2026-0042', score: 5.3, affects: ['server', 'worker'] },
  { id: 'CVE-2026-3141', score: 7.5, affects: ['server'] },
  { id: 'CVE-2026-1024', score: 9.9, affects: ['server', 'worker'] },
]

/** Sim seconds between disclosures. */
export const CVE_EVERY = 420
/** Sim seconds a patch ticket can stay overdue before the CVE is exploited. */
export const PATCH_GRACE = 60
/** The Dev Hours a patch takes: 2 for a low score, 5 for a critical one. */
export const patchCost = (score: number): number => Math.max(2, Math.round(score / 2))
/** Sim seconds from disclosure to the deadline: 3.5 minutes for a 9.9, 6.5 for a 5.3. */
export const patchWindow = (score: number): number => Math.round(600 - 40 * score)
