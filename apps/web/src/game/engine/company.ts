import { CREDIT_CAP, ERAS, FIRST_INCIDENT_AFTER, type ComponentId } from './catalog.ts'
import type { Game, GameNode } from './state.ts'

/* ==========================================================================
   A new Company: the Garage start the design describes, and a Pre-seed start
   for playtests that want to skip straight to the database problems.
   ========================================================================== */

const node = (
  id: string,
  type: ComponentId,
  x: number,
  y: number,
  extra: Partial<GameNode> = {},
): GameNode => ({
  id,
  type,
  x,
  y,
  size: 1,
  family: 'general',
  runtime: 'mod_php',
  framework: 'none',
  workers: 5,
  localDb: false,
  sample: 1,
  down: 0,
  warm: 1,
  credits: 0,
  leak: 0,
  ...extra,
})

const company = (seed: number): Omit<Game, 'nodes' | 'links'> => ({
  nextId: 1,
  cash: 300,
  insight: 0,
  users: 150,
  pending: 0,
  spilled: 0,
  researched: [],
  stage: 0,
  equity: 1,
  declined: false,
  time: 0,
  seed,
  apdex: 1,
  incident: null,
  lastIncident: null,
  nextIncidentAt: Number.MAX_SAFE_INTEGER,
  postmortems: [],
  postmortemSeq: 0,
  openActions: [],
  alarms: { errors: 0, latency: 0, saturation: 0 },
  earned: 0,
  history: [],
})

/**
 * The Garage: one Burstable box runs PHP under Apache and Postgres on the same
 * machine, linked to Users. Analytics samples the box.
 */
export const newGame = (seed = 20_261_031): Game => ({
  ...company(seed),
  nodes: [
    node('users', 'users', 120, 280),
    node('server', 'server', 440, 280, {
      family: 'burstable',
      localDb: true,
      credits: CREDIT_CAP,
    }),
    node('analytics', 'analytics', 760, 520),
    node('payments', 'payments', 440, 540),
  ],
  links: [
    { from: 'users', to: 'server' },
    { from: 'server', to: 'analytics' },
  ],
})

/** Pre-seed with the Garage lessons already learned: Postgres split out, PHP-FPM, Stripe. */
export const preseedGame = (seed = 20_261_031): Game => {
  const garage = ERAS[0]
  return {
    ...company(seed),
    nodes: [
      node('users', 'users', 120, 280),
      node('server', 'server', 440, 280, { size: 2, runtime: 'php_fpm', workers: 16 }),
      node('database', 'database', 760, 280, { size: 1 }),
      node('analytics', 'analytics', 760, 520),
      node('payments', 'payments', 440, 540),
    ],
    links: [
      { from: 'users', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'analytics' },
    ],
    cash: 300 + (garage?.grant ?? 0),
    insight: 40,
    users: 1_050,
    stage: 1,
    equity: 1 - (garage?.dilution ?? 0),
    researched: ['stripe', 'php-fpm', 'logs', 'metrics', 'load-balancing'],
    time: 12 * 60,
    nextIncidentAt: 12 * 60 + FIRST_INCIDENT_AFTER,
  }
}
