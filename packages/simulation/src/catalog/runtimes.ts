/* Languages, runtime variants and frameworks: the Stack of an App Server. */

import type { RequestKind } from './kinds.ts'
import type { ResearchId } from './research.ts'

export const LANGUAGE_IDS = ['php', 'ruby', 'node', 'python'] as const
export type LanguageId = (typeof LANGUAGE_IDS)[number]

export type LanguageDef = Readonly<{
  id: LanguageId
  name: string
  /** Velocity: how fast this language ships features. */
  velocity: number
  /** Salary relative to the base (06 "Hiring and salaries"). */
  salary: number
  /** Time to hire relative to one calendar day. */
  hireTime: number
  /** Minutes one build takes (06 "Language profiles"). */
  buildMinutes: number
}>

export const LANGUAGES: Record<LanguageId, LanguageDef> = {
  php: { id: 'php', name: 'PHP', velocity: 1.2, salary: 0.85, hireTime: 1, buildMinutes: 0.5 },
  ruby: { id: 'ruby', name: 'Ruby', velocity: 1.1, salary: 1.1, hireTime: 1.5, buildMinutes: 1 },
  node: { id: 'node', name: 'Node.js', velocity: 1.15, salary: 1, hireTime: 1, buildMinutes: 3 },
  python: {
    id: 'python',
    name: 'Python',
    velocity: 1.15,
    salary: 1.05,
    hireTime: 1,
    buildMinutes: 1,
  },
}

export const RUNTIME_IDS = [
  'mod_php',
  'php_fpm',
  'puma',
  'node',
  'node_cluster',
  'gunicorn',
] as const
export type RuntimeId = (typeof RUNTIME_IDS)[number]

export type ConcurrencyModel = 'process' | 'threads' | 'loop'

/** The six axes of a Stack choice (06 "The six axes"), 1 to 5; higher is better, so 5 memory is lean. */
export const AXES = [
  'throughput',
  'tail',
  'memory',
  'velocity',
  'resilience',
  'operability',
] as const
export type Axis = (typeof AXES)[number]
export type Axes = Readonly<Record<Axis, 1 | 2 | 3 | 4 | 5>>

export type RuntimeDef = Readonly<{
  id: RuntimeId
  axes: Axes
  /** Anchors in docs/gdd/glossary.md for the behavior behind the axes. */
  glossary: ReadonlyArray<string>
  language: LanguageId
  name: string
  model: ConcurrencyModel
  /** CPU speed relative to Go = 1.0. */
  speed: number
  /** MB per worker process, or per process for threads and event loops. */
  memory: number
  /** The player sets the pool size (pm.max_children, Gunicorn workers). */
  pool: boolean
  /** Threads per process for thread pools. */
  threads: number
  /** Database connections each process holds. */
  connections: number
  /** Processes live across requests, so memory can leak. */
  persistent: boolean
  /** Seconds the runtime needs to boot after a restart. */
  startup: number
  /** Share of full speed a cold process runs at, before JIT warmup. PHP warms through OPcache instead. */
  warmFrom: number
  research: ResearchId | null
  blurb: string
}>

export const RUNTIMES: Record<RuntimeId, RuntimeDef> = {
  mod_php: {
    id: 'mod_php',
    axes: { throughput: 1, tail: 3, memory: 1, velocity: 4, resilience: 5, operability: 5 },
    glossary: ['process-per-request', 'shared-nothing'],
    language: 'php',
    name: 'Apache mod_php',
    model: 'process',
    speed: 0.15,
    memory: 60,
    pool: false,
    threads: 1,
    connections: 1,
    persistent: false,
    startup: 0,
    warmFrom: 1,
    research: null,
    blurb:
      'Apache starts a process per request in flight, up to 150. Every process embeds PHP, so RAM runs out early.',
  },
  php_fpm: {
    id: 'php_fpm',
    axes: { throughput: 2, tail: 4, memory: 3, velocity: 4, resilience: 5, operability: 4 },
    glossary: ['process-per-request', 'shared-nothing'],
    language: 'php',
    name: 'PHP-FPM',
    model: 'process',
    speed: 0.15,
    memory: 40,
    pool: true,
    threads: 1,
    connections: 1,
    persistent: false,
    startup: 0,
    warmFrom: 1,
    research: 'php-fpm',
    blurb:
      'A fixed pool of PHP workers behind NGINX. Each waiting request holds a worker. Shared nothing: no leaks.',
  },
  puma: {
    id: 'puma',
    axes: { throughput: 3, tail: 3, memory: 2, velocity: 3, resilience: 4, operability: 2 },
    glossary: ['gil-global-interpreter-lock', 'cold-start'],
    language: 'ruby',
    name: 'Puma',
    model: 'threads',
    speed: 0.25,
    memory: 180,
    pool: false,
    threads: 5,
    connections: 5,
    persistent: true,
    startup: 10,
    warmFrom: 0.9,
    research: 'lang-ruby',
    blurb:
      'One process per core, 5 threads each. Threads overlap waits; the GVL keeps CPU on one core.',
  },
  node: {
    id: 'node',
    axes: { throughput: 4, tail: 2, memory: 4, velocity: 4, resilience: 2, operability: 4 },
    glossary: ['event-loop', 'blast-radius'],
    language: 'node',
    name: 'Node.js',
    model: 'loop',
    speed: 0.7,
    memory: 80,
    pool: false,
    threads: 1,
    connections: 10,
    persistent: true,
    startup: 1,
    warmFrom: 0.8,
    research: 'lang-node',
    blurb:
      'One event loop. Waiting costs nothing, but it uses one core, and one slow request stalls every other.',
  },
  node_cluster: {
    id: 'node_cluster',
    axes: { throughput: 5, tail: 2, memory: 3, velocity: 4, resilience: 3, operability: 4 },
    glossary: ['event-loop', 'vertical-and-horizontal-scaling'],
    language: 'node',
    name: 'Node.js cluster',
    model: 'loop',
    speed: 0.7,
    memory: 80,
    pool: false,
    threads: 1,
    connections: 10,
    persistent: true,
    startup: 1,
    warmFrom: 0.8,
    research: 'node-cluster',
    blurb: 'One event loop per core. Uses every core; memory and connections grow with the cores.',
  },
  gunicorn: {
    id: 'gunicorn',
    axes: { throughput: 2, tail: 4, memory: 2, velocity: 5, resilience: 5, operability: 3 },
    glossary: ['process-per-request', 'gil-global-interpreter-lock'],
    language: 'python',
    name: 'Gunicorn',
    model: 'process',
    speed: 0.2,
    memory: 120,
    pool: true,
    threads: 1,
    connections: 1,
    persistent: true,
    startup: 5,
    warmFrom: 0.95,
    research: 'lang-python',
    blurb: 'A pool of sync workers, one request each. Like PHP-FPM with more memory per worker.',
  },
}

/** Apache MaxRequestWorkers, and the spare processes it keeps. */
export const APACHE_MAX_WORKERS = 150
export const APACHE_SPARE = 5
/** OPcache multiplies PHP CPU speed. */
export const OPCACHE_SPEED = 2.5
/** Pool sizes the player can pick from for pooled runtimes. */
export const POOL_LIMITS = { min: 1, max: 400 } as const
/** PHP-FPM ships with pm.max_children = 5. */
export const DEFAULT_FPM_WORKERS = 5

export const FRAMEWORK_IDS = [
  'none',
  'laravel',
  'rails',
  'express',
  'django',
  'symfony',
  'sinatra',
  'flask',
] as const
export type FrameworkId = (typeof FRAMEWORK_IDS)[number]

export type FrameworkDef = Readonly<{
  id: FrameworkId
  axes: Axes
  /** Anchors in docs/gdd/glossary.md for the behavior behind the axes. */
  glossary: ReadonlyArray<string>
  name: string
  language: LanguageId | null
  /** CPU overhead per request. */
  overhead: number
  /** Velocity multiplier. */
  velocity: number
  /** Extra MB per process. */
  memory: number
  /** The ORM makes N+1 queries until Eager loading. */
  orm: boolean
  /** Revenue multiplier per request kind. */
  value: Partial<Record<RequestKind, number>>
  blurb: string
}>

export const FRAMEWORKS: Record<FrameworkId, FrameworkDef> = {
  none: {
    id: 'none',
    axes: { throughput: 5, tail: 4, memory: 5, velocity: 1, resilience: 2, operability: 5 },
    glossary: ['tech-debt'],
    name: 'No framework',
    language: null,
    overhead: 1,
    velocity: 0.8,
    memory: 0,
    orm: false,
    value: {},
    blurb: 'Fast to run, slow to build features.',
  },
  laravel: {
    id: 'laravel',
    axes: { throughput: 2, tail: 3, memory: 4, velocity: 5, resilience: 3, operability: 3 },
    glossary: ['n1-query'],
    name: 'Laravel',
    language: 'php',
    overhead: 1.8,
    velocity: 1.45,
    memory: 10,
    orm: true,
    value: {},
    blurb: 'Ships features fast. 1.8× CPU, and Eloquent makes 3 read queries where 1 would do.',
  },
  rails: {
    id: 'rails',
    axes: { throughput: 3, tail: 3, memory: 2, velocity: 5, resilience: 3, operability: 3 },
    glossary: ['n1-query'],
    name: 'Rails',
    language: 'ruby',
    overhead: 1.5,
    velocity: 1.5,
    memory: 70,
    orm: true,
    value: { page: 1.2 },
    blurb: 'Ships features fast, page views earn 20% more. 1.5× CPU and N+1 queries.',
  },
  express: {
    id: 'express',
    axes: { throughput: 4, tail: 4, memory: 4, velocity: 3, resilience: 2, operability: 4 },
    glossary: ['tech-debt'],
    name: 'Express',
    language: 'node',
    overhead: 1.1,
    velocity: 1.2,
    memory: 10,
    orm: false,
    value: {},
    blurb: 'Minimal and everywhere. 1.1× CPU.',
  },
  django: {
    id: 'django',
    axes: { throughput: 3, tail: 3, memory: 3, velocity: 5, resilience: 3, operability: 3 },
    glossary: ['n1-query'],
    name: 'Django',
    language: 'python',
    overhead: 1.4,
    velocity: 1.4,
    memory: 30,
    orm: true,
    value: {},
    blurb: 'Ships features fast. 1.4× CPU and N+1 queries.',
  },
  symfony: {
    id: 'symfony',
    axes: { throughput: 3, tail: 3, memory: 4, velocity: 4, resilience: 4, operability: 3 },
    glossary: ['tech-debt'],
    name: 'Symfony',
    language: 'php',
    overhead: 1.5,
    velocity: 1.25,
    memory: 10,
    orm: false,
    value: {},
    blurb: 'Strict structure. 1.5× CPU, no N+1 queries, and slower tech debt.',
  },
  sinatra: {
    id: 'sinatra',
    axes: { throughput: 4, tail: 4, memory: 5, velocity: 3, resilience: 3, operability: 4 },
    glossary: [],
    name: 'Sinatra',
    language: 'ruby',
    overhead: 1.1,
    velocity: 1.1,
    memory: 5,
    orm: false,
    value: {},
    blurb: 'Light. 1.1× CPU.',
  },
  flask: {
    id: 'flask',
    axes: { throughput: 4, tail: 4, memory: 4, velocity: 3, resilience: 3, operability: 4 },
    glossary: [],
    name: 'Flask',
    language: 'python',
    overhead: 1.1,
    velocity: 1.1,
    memory: 10,
    orm: false,
    value: {},
    blurb: 'Light. 1.1× CPU.',
  },
}

/** N+1 queries multiply ORM reads. */
export const ORM_READS = 3

/**
 * PHP-FPM process managers (06): spare workers kept, the share of requests that wait for a fork,
 * and how long they wait. Dynamic's spares absorb most of a fork, so its requests wait less.
 */
export const PM_MODES = {
  static: { label: 'Static', spares: null, spawnShare: 0, spawnMs: 0 },
  dynamic: { label: 'Dynamic', spares: 2, spawnShare: 0.02, spawnMs: 20 },
  ondemand: { label: 'On demand', spares: 0, spawnShare: 0.1, spawnMs: 50 },
} as const
