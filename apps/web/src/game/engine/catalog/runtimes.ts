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
}>

export const LANGUAGES: Record<LanguageId, LanguageDef> = {
  php: { id: 'php', name: 'PHP', velocity: 1.2 },
  ruby: { id: 'ruby', name: 'Ruby', velocity: 1.1 },
  node: { id: 'node', name: 'Node.js', velocity: 1.15 },
  python: { id: 'python', name: 'Python', velocity: 1.15 },
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

export type RuntimeDef = Readonly<{
  id: RuntimeId
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
  research: ResearchId | null
  blurb: string
}>

export const RUNTIMES: Record<RuntimeId, RuntimeDef> = {
  mod_php: {
    id: 'mod_php',
    language: 'php',
    name: 'Apache mod_php',
    model: 'process',
    speed: 0.15,
    memory: 60,
    pool: false,
    threads: 1,
    connections: 1,
    persistent: false,
    research: null,
    blurb:
      'Apache starts a process per request in flight, up to 150. Every process embeds PHP, so RAM runs out early.',
  },
  php_fpm: {
    id: 'php_fpm',
    language: 'php',
    name: 'PHP-FPM',
    model: 'process',
    speed: 0.15,
    memory: 40,
    pool: true,
    threads: 1,
    connections: 1,
    persistent: false,
    research: 'php-fpm',
    blurb:
      'A fixed pool of PHP workers behind NGINX. Each waiting request holds a worker. Shared nothing: no leaks.',
  },
  puma: {
    id: 'puma',
    language: 'ruby',
    name: 'Puma',
    model: 'threads',
    speed: 0.25,
    memory: 180,
    pool: false,
    threads: 5,
    connections: 5,
    persistent: true,
    research: 'lang-ruby',
    blurb:
      'One process per core, 5 threads each. Threads overlap waits; the GVL keeps CPU on one core.',
  },
  node: {
    id: 'node',
    language: 'node',
    name: 'Node.js',
    model: 'loop',
    speed: 0.7,
    memory: 80,
    pool: false,
    threads: 1,
    connections: 10,
    persistent: true,
    research: 'lang-node',
    blurb:
      'One event loop. Waiting costs nothing, but it uses one core, and one slow request stalls every other.',
  },
  node_cluster: {
    id: 'node_cluster',
    language: 'node',
    name: 'Node.js cluster',
    model: 'loop',
    speed: 0.7,
    memory: 80,
    pool: false,
    threads: 1,
    connections: 10,
    persistent: true,
    research: 'node-cluster',
    blurb: 'One event loop per core. Uses every core; memory and connections grow with the cores.',
  },
  gunicorn: {
    id: 'gunicorn',
    language: 'python',
    name: 'Gunicorn',
    model: 'process',
    speed: 0.2,
    memory: 120,
    pool: true,
    threads: 1,
    connections: 1,
    persistent: true,
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

export const FRAMEWORK_IDS = ['none', 'laravel', 'rails', 'express', 'django'] as const
export type FrameworkId = (typeof FRAMEWORK_IDS)[number]

export type FrameworkDef = Readonly<{
  id: FrameworkId
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
    name: 'Django',
    language: 'python',
    overhead: 1.4,
    velocity: 1.4,
    memory: 30,
    orm: true,
    value: {},
    blurb: 'Ships features fast. 1.4× CPU and N+1 queries.',
  },
}

/** N+1 queries multiply ORM reads. */
export const ORM_READS = 3

/**
 * Velocity stands in for features until the Team system exists: a faster
 * Stack ships more, which grows the market.
 */
export const marketFor = (velocity: number): number => 0.7 + 0.3 * velocity
