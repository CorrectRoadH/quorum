/* Instance types, and the hardware constants every sized Node shares. */

export const SIZES = [
  { name: 'nano', vcpu: 0.5 },
  { name: 'micro', vcpu: 1 },
  { name: 'small', vcpu: 2 },
  { name: 'medium', vcpu: 4 },
  { name: 'large', vcpu: 8 },
  { name: 'xlarge', vcpu: 16 },
  { name: '2xlarge', vcpu: 32 },
] as const

export const FAMILY_IDS = ['burstable', 'general', 'compute', 'memory'] as const
export type FamilyId = (typeof FAMILY_IDS)[number]

export type FamilyDef = Readonly<{
  id: FamilyId
  name: string
  /** GB of RAM per vCPU. */
  ram: number
  /** Price per vCPU, relative to General. */
  price: number
  blurb: string
}>

export const FAMILIES: Record<FamilyId, FamilyDef> = {
  burstable: {
    id: 'burstable',
    name: 'Burstable',
    ram: 2,
    price: 0.4,
    blurb: 'Cheap. Earns CPU credits while idle and drops to 20% CPU when they run out.',
  },
  general: { id: 'general', name: 'General', ram: 4, price: 1, blurb: '1 vCPU : 4 GB.' },
  compute: { id: 'compute', name: 'Compute', ram: 2, price: 0.85, blurb: '1 vCPU : 2 GB.' },
  memory: { id: 'memory', name: 'Memory', ram: 8, price: 1.3, blurb: '1 vCPU : 8 GB.' },
}

/** Dollars per second for one General vCPU. */
export const VCPU_PRICE = 0.05
/** A Burstable box runs at this share of its vCPU when it has no credits. */
export const BURST_BASELINE = 0.2
/** Credits a Burstable box can bank, in core-seconds per vCPU. */
export const CREDIT_CAP = 100
/** GB the OS takes on every box. */
export const OS_RAM = 0.25
/** Postgres on the App Server: a base, plus working set per user. */
export const LOCAL_DB_RAM = 0.6
export const LOCAL_DB_RAM_PER_USER = 0.0015
/** Postgres and the app fight over the same cores and page cache on one box. */
export const LOCAL_DB_CONTENTION = 1.5
/** Postgres `max_connections`. */
export const MAX_CONNECTIONS = 100
/** Server connections a pooler keeps open to each database. */
export const POOLER_CONNECTIONS = 20
/** Seconds a Node is down while it restarts after a resize or a change of runtime. */
export const RESTART_SECONDS = 2
/** Seconds a cold Node needs to warm up. */
export const WARMUP_SECONDS = 15
