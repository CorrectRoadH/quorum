import type { Design, LedgerRow, Node, RoleKey, Tone } from './model.ts'

/* ==========================================================================
   Quorum — content. Scenario data, the Role hats, and the The Blog design
   the run screen opens on. Balance numbers are placeholders; the shape is
   the product.
   ========================================================================== */

export type Role = Readonly<{
  key: RoleKey
  name: string
  scope: string
  objective: string
}>

export const roles: ReadonlyArray<Role> = [
  {
    key: 'edge',
    name: 'Edge Lead',
    scope: 'Traffic, latency, cache',
    objective:
      'The user side. Latency and served requests carry double weight in your slice of the report card.',
  },
  {
    key: 'data',
    name: 'Data Lead',
    scope: 'Storage, writes, consistency',
    objective:
      'The data side. Stale reads and write latency carry double weight in your slice of the report card.',
  },
  {
    key: 'platform',
    name: 'Platform Lead',
    scope: 'Capacity, cost, survival',
    objective:
      'The cluster side. Utilization, Burn and survival through failures carry double weight in your slice.',
  },
]

export const roleByKey = (key: RoleKey): Role =>
  roles.find((role) => role.key === key) ?? (roles[0] as Role)

export type Failure = Readonly<{
  when: string
  what: string
  tone: 'plain' | 'warn' | 'danger'
}>

export type Scenario = Readonly<{
  id: string
  index: number
  name: string
  teaches: string
  headline: string
  brief: string
  minutes: number
  complexity: 1 | 2 | 3
  role: RoleKey
  locked: boolean
  angle: string
  demand: ReadonlyArray<string>
  peak: string
  numbers: ReadonlyArray<Readonly<{ label: string; value: string }>>
  failures: ReadonlyArray<Failure>
  components: ReadonlyArray<Readonly<{ name: string; family: 'cluster' | 'managed' }>>
}>

export const scenarios: ReadonlyArray<Scenario> = [
  {
    id: 'the-blog',
    index: 1,
    name: 'The Blog',
    teaches: 'The loop itself',
    headline: 'Keep a small blog alive for a month',
    brief:
      'You inherit one web app, one database and $12,000. Traffic grows all month and Tuesday morning is worse than the curve says. Serve the requests, keep p95 under 120 ms, and do not spend the Capital you are scored on keeping.',
    minutes: 15,
    complexity: 1,
    role: 'edge',
    locked: false,
    angle: 'Start here',
    demand: [
      '0,88',
      '40,86',
      '80,82',
      '120,74',
      '160,62',
      '178,34',
      '188,32',
      '200,58',
      '240,48',
      '280,38',
      '320,30',
    ],
    peak: '3.6k rps',
    numbers: [
      { label: 'Capital', value: '$12,000' },
      { label: 'Income', value: '$0.004 / request' },
      { label: 'Current Burn', value: '$470 / month' },
      { label: 'Target p95', value: '< 120 ms' },
      { label: 'Target served', value: '> 98%' },
      { label: 'Capital to keep', value: '$3,000' },
    ],
    failures: [
      {
        when: 'Week 1 · Wed 03:00',
        what: 'One replica of Web App restarts. Rollout covers it if you run two.',
        tone: 'plain',
      },
      {
        when: 'Week 2 · Tue 09:00',
        what: 'Traffic spike: demand doubles for 40 Ticks. This is the one that breaks the database.',
        tone: 'warn',
      },
      {
        when: 'Week 3 · Thu 02:00',
        what: 'Zone failure: one Node of the fixed cluster dies for 20 Ticks. It keeps billing.',
        tone: 'danger',
      },
      {
        when: 'Week 4 · Mon 11:00',
        what: 'Crash loop: any Node above 95% utilization for 15 Ticks restarts itself repeatedly.',
        tone: 'danger',
      },
    ],
    components: [
      { name: 'Load Balancer', family: 'cluster' },
      { name: 'Web App', family: 'cluster' },
      { name: 'Postgres', family: 'cluster' },
      { name: 'Cache', family: 'managed' },
      { name: 'Queue', family: 'managed' },
      { name: 'Worker', family: 'cluster' },
      { name: 'Object Store', family: 'managed' },
      { name: 'CDN', family: 'managed' },
    ],
  },
  {
    id: 'incident-3am',
    index: 2,
    name: 'Incident: 3AM',
    teaches: 'Diagnosis under pressure',
    headline: 'Walk in at 03:00 and find the design already broken',
    brief:
      'The run starts mid-incident. A Node is crash-looping, the metrics table is the only witness, and every Tick you spend reading costs Burn. Fix it before the month ends.',
    minutes: 20,
    complexity: 2,
    role: 'platform',
    locked: true,
    angle: 'Complex',
    demand: ['0,70', '60,66', '120,58', '180,44', '240,52', '300,40', '320,36'],
    peak: '2.4k rps',
    numbers: [
      { label: 'Capital', value: '$9,400' },
      { label: 'Income', value: '$0.005 / request' },
      { label: 'Current Burn', value: '$1,180 / month' },
      { label: 'Target p95', value: '< 150 ms' },
      { label: 'Target served', value: '> 96%' },
      { label: 'Capital to keep', value: '$4,000' },
    ],
    failures: [
      {
        when: 'Tick 1',
        what: 'Search enters CrashLoopBackOff. It stays down and keeps burning.',
        tone: 'danger',
      },
      {
        when: 'Tick 180',
        what: 'The queue backs up past its limit and starts rejecting.',
        tone: 'warn',
      },
      { when: 'Tick 520', what: 'A second replica dies. You are down to one.', tone: 'danger' },
    ],
    components: [
      { name: 'Load Balancer', family: 'cluster' },
      { name: 'Web App', family: 'cluster' },
      { name: 'Postgres', family: 'cluster' },
      { name: 'Cache', family: 'managed' },
      { name: 'Queue', family: 'managed' },
      { name: 'Search', family: 'cluster' },
    ],
  },
  {
    id: 'read-heavy',
    index: 3,
    name: 'Read-Heavy',
    teaches: 'Cache staleness against speed',
    headline: 'Reads outnumber writes nine to one',
    brief:
      'A read that follows a write inside the TTL returns the old page, and that counts as a failed request. Choose your TTL, or pay for write-through.',
    minutes: 20,
    complexity: 2,
    role: 'data',
    locked: true,
    angle: 'Complex',
    demand: ['0,80', '80,74', '160,66', '240,50', '320,34'],
    peak: '5.1k rps',
    numbers: [
      { label: 'Capital', value: '$11,000' },
      { label: 'Income', value: '$0.003 / request' },
      { label: 'Current Burn', value: '$820 / month' },
      { label: 'Target p95', value: '< 90 ms' },
      { label: 'Target served', value: '> 99%' },
      { label: 'Capital to keep', value: '$3,500' },
    ],
    failures: [
      { when: 'Tick 240', what: 'A write storm: 40 writes per Tick for 60 Ticks.', tone: 'warn' },
      {
        when: 'Tick 600',
        what: 'The primary hits 95% utilization and starts queuing reads.',
        tone: 'danger',
      },
    ],
    components: [
      { name: 'Load Balancer', family: 'cluster' },
      { name: 'Web App', family: 'cluster' },
      { name: 'Postgres', family: 'cluster' },
      { name: 'Cache', family: 'managed' },
      { name: 'CDN', family: 'managed' },
    ],
  },
  {
    id: 'the-spike',
    index: 4,
    name: 'The Spike',
    teaches: 'Demand growth against Capital',
    headline: 'Demand triples in nine Ticks',
    brief:
      'You cannot buy capacity you did not save for. The design that survived The Blog does not survive this, and the clock does not slow down.',
    minutes: 25,
    complexity: 3,
    role: 'edge',
    locked: true,
    angle: 'Complex',
    demand: ['0,86', '60,84', '120,80', '160,30', '176,26', '200,62', '260,46', '320,24'],
    peak: '9.8k rps',
    numbers: [
      { label: 'Capital', value: '$14,000' },
      { label: 'Income', value: '$0.003 / request' },
      { label: 'Current Burn', value: '$1,400 / month' },
      { label: 'Target p95', value: '< 140 ms' },
      { label: 'Target served', value: '> 97%' },
      { label: 'Capital to keep', value: '$5,000' },
    ],
    failures: [
      {
        when: 'Week 2 · Tue 09:00',
        what: 'Demand triples for 30 Ticks. Nothing you place is fast enough.',
        tone: 'danger',
      },
      { when: 'Week 3', what: 'Burn catches up with Income. Capital stops growing.', tone: 'warn' },
    ],
    components: [
      { name: 'Load Balancer', family: 'cluster' },
      { name: 'Web App', family: 'cluster' },
      { name: 'Postgres', family: 'cluster' },
      { name: 'Cache', family: 'managed' },
      { name: 'Queue', family: 'managed' },
      { name: 'Worker', family: 'cluster' },
      { name: 'CDN', family: 'managed' },
    ],
  },
  {
    id: 'zone-down',
    index: 5,
    name: 'Zone Down',
    teaches: 'Resilience in a fixed cluster',
    headline: 'One node of the cluster dies for twenty Ticks',
    brief:
      'The cluster is not yours to size. A zone failure takes one Node down for its full duration and it keeps billing, so placement is the whole game.',
    minutes: 25,
    complexity: 3,
    role: 'platform',
    locked: true,
    angle: 'Complex',
    demand: ['0,78', '80,74', '160,68', '240,58', '320,44'],
    peak: '4.2k rps',
    numbers: [
      { label: 'Capital', value: '$10,500' },
      { label: 'Income', value: '$0.004 / request' },
      { label: 'Current Burn', value: '$1,050 / month' },
      { label: 'Target p95', value: '< 130 ms' },
      { label: 'Target served', value: '> 99%' },
      { label: 'Capital to keep', value: '$3,000' },
    ],
    failures: [
      {
        when: 'Week 2 · Thu 02:00',
        what: 'Zone failure: one Node of the fixed cluster is gone for 20 Ticks.',
        tone: 'danger',
      },
      {
        when: 'Week 4 · Thu 02:00',
        what: 'The same zone fails again, harder. 40 Ticks this time.',
        tone: 'danger',
      },
    ],
    components: [
      { name: 'Load Balancer', family: 'cluster' },
      { name: 'Web App', family: 'cluster' },
      { name: 'Postgres', family: 'cluster' },
      { name: 'Cache', family: 'managed' },
      { name: 'DNS', family: 'managed' },
    ],
  },
  {
    id: 'cut-thirty',
    index: 6,
    name: 'Cut 30%',
    teaches: 'Right-sizing when the money shrinks',
    headline: 'The design works. Make it cost 30% less',
    brief:
      'Income drops on day one and stays down. Every Node you keep has to earn its Burn, and the targets do not move. This is the hardest edit of the six.',
    minutes: 30,
    complexity: 3,
    role: 'data',
    locked: true,
    angle: 'Complex',
    demand: ['0,84', '80,80', '160,74', '240,66', '320,58'],
    peak: '2.9k rps',
    numbers: [
      { label: 'Capital', value: '$8,000' },
      { label: 'Income', value: '$0.002 / request' },
      { label: 'Current Burn', value: '$1,900 / month' },
      { label: 'Target p95', value: '< 120 ms' },
      { label: 'Target served', value: '> 98%' },
      { label: 'Capital to keep', value: '$2,000' },
    ],
    failures: [
      { when: 'Tick 1', what: 'Income halves. Your Burn does not.', tone: 'danger' },
      {
        when: 'Tick 400',
        what: 'Capital runs dry and the design sheds the cheapest Node it can pay for.',
        tone: 'warn',
      },
    ],
    components: [
      { name: 'Load Balancer', family: 'cluster' },
      { name: 'Web App', family: 'cluster' },
      { name: 'Postgres', family: 'cluster' },
      { name: 'Cache', family: 'managed' },
      { name: 'Worker', family: 'cluster' },
    ],
  },
]

export const scenarioById = (id: string): Scenario =>
  scenarios.find((scenario) => scenario.id === id) ?? (scenarios[0] as Scenario)

/* --------------------------------------------------------------------------
   The Blog, as it stands at Tick 306. The run screen opens on this design.
   -------------------------------------------------------------------------- */

export const node = (
  id: string,
  name: string,
  family: 'cluster' | 'managed',
  meta: string,
  replicas: number,
  util: number,
  inbound: string,
  capacity: string,
  state: Node['state'],
  x: number,
  y: number,
): Node => ({ id, name, family, meta, replicas, util, inbound, capacity, state, x, y })

export const openingDesign: Design = {
  selected: 'web',
  nodes: [
    node('lb', 'Load Balancer', 'cluster', 'Cluster · edge', 2, 45, '1.80k', '4.0k', 'ok', 40, 210),
    node(
      'web',
      'Web App',
      'cluster',
      'Cluster · app:1.4.2',
      3,
      84,
      '1.76k',
      '2.1k',
      'warn',
      244,
      88,
    ),
    node('cache', 'Cache', 'managed', 'Managed · 128 MB', 1, 41, '1.20k', '3.0k', 'ok', 244, 314),
    node(
      'db',
      'Postgres',
      'cluster',
      'Cluster · 2 vCPU',
      2,
      96,
      '1.10k',
      '1.15k',
      'danger',
      452,
      210,
    ),
    node('queue', 'Queue', 'managed', 'Managed · 10k msg', 1, 23, '420', '2.0k', 'ok', 452, 356),
    node('worker', 'Worker', 'cluster', 'Cluster · cron', 2, 28, '400', '1.4k', 'ok', 636, 356),
    node(
      'store',
      'Object Store',
      'managed',
      'Managed · 50 GB',
      1,
      12,
      '180',
      '8.0k',
      'ok',
      636,
      88,
    ),
    node('search', 'Search', 'cluster', 'CrashLoopBackOff', 1, 0, '0', '900', 'down', 636, 210),
  ],
  links: [
    { from: 'lb', to: 'web', active: true, flow: false },
    { from: 'web', to: 'cache', active: false, flow: false },
    { from: 'web', to: 'db', active: false, flow: true },
    { from: 'cache', to: 'db', active: false, flow: false },
    { from: 'web', to: 'queue', active: false, flow: false },
    { from: 'queue', to: 'worker', active: false, flow: false },
    { from: 'worker', to: 'store', active: false, flow: false },
    { from: 'web', to: 'search', active: false, flow: false },
  ],
}

/** The hero diagram on the title screen: four Nodes, one hot database. */
export const heroDesign: Design = {
  selected: null,
  nodes: [
    node('lb', 'Load Balancer', 'cluster', 'Cluster · edge', 2, 45, '1.80k', '4.0k', 'ok', 30, 200),
    node(
      'web',
      'Web App',
      'cluster',
      'Cluster · app:1.4.2',
      3,
      84,
      '1.76k',
      '2.1k',
      'warn',
      220,
      80,
    ),
    node('cache', 'Cache', 'managed', 'Managed · 128 MB', 1, 41, '1.20k', '3.0k', 'ok', 220, 310),
    node(
      'db',
      'Postgres',
      'cluster',
      'Cluster · 2 vCPU',
      2,
      96,
      '1.10k',
      '1.15k',
      'danger',
      410,
      195,
    ),
  ],
  links: [
    { from: 'lb', to: 'web', active: true, flow: false },
    { from: 'web', to: 'cache', active: false, flow: true },
    { from: 'web', to: 'db', active: false, flow: false },
    { from: 'cache', to: 'db', active: false, flow: false },
  ],
}

export const openingLedger: ReadonlyArray<LedgerRow> = [
  {
    nodeId: 'web',
    name: 'Web App',
    replicas: 3,
    burn: 480,
    inbound: '1.76k',
    capacity: '2.1k',
    util: 84,
    p50: '82',
    p99: '214',
    errors: '0.2%',
    status: 'Degraded',
    tone: 'warn',
    rowTone: 'warn',
  },
  {
    nodeId: 'lb',
    name: 'Load Balancer',
    replicas: 2,
    burn: 120,
    inbound: '1.80k',
    capacity: '4.0k',
    util: 45,
    p50: '12',
    p99: '48',
    errors: '0.0%',
    status: 'Running',
    tone: 'ok',
    rowTone: 'plain',
  },
  {
    nodeId: 'db',
    name: 'Postgres',
    replicas: 2,
    burn: 620,
    inbound: '1.10k',
    capacity: '1.15k',
    util: 96,
    p50: '44',
    p99: '380',
    errors: '3.8%',
    status: 'Saturated',
    tone: 'danger',
    rowTone: 'danger',
  },
  {
    nodeId: 'cache',
    name: 'Cache',
    replicas: 1,
    burn: 90,
    inbound: '1.20k',
    capacity: '3.0k',
    util: 41,
    p50: '4',
    p99: '11',
    errors: '1.1%',
    status: 'Stale reads',
    tone: 'warn',
    rowTone: 'warn',
  },
  {
    nodeId: 'queue',
    name: 'Queue',
    replicas: 1,
    burn: 60,
    inbound: '420',
    capacity: '2.0k',
    util: 23,
    p50: '6',
    p99: '18',
    errors: '0.0%',
    status: 'Running',
    tone: 'ok',
    rowTone: 'plain',
  },
  {
    nodeId: 'worker',
    name: 'Worker',
    replicas: 2,
    burn: 180,
    inbound: '400',
    capacity: '1.4k',
    util: 28,
    p50: '9',
    p99: '26',
    errors: '0.0%',
    status: 'Running',
    tone: 'ok',
    rowTone: 'plain',
  },
  {
    nodeId: 'search',
    name: 'Search',
    replicas: 1,
    burn: 140,
    inbound: '0',
    capacity: '900',
    util: 0,
    p50: '—',
    p99: '—',
    errors: '100%',
    status: 'CrashLoop',
    tone: 'danger',
    rowTone: 'danger',
  },
  {
    nodeId: 'store',
    name: 'Object Store',
    replicas: 1,
    burn: 40,
    inbound: '180',
    capacity: '8.0k',
    util: 12,
    p50: '21',
    p99: '60',
    errors: '0.0%',
    status: 'Running',
    tone: 'ok',
    rowTone: 'plain',
  },
]

export const catalog: ReadonlyArray<
  Readonly<{
    key: 'edge' | 'data' | 'platform'
    label: string
    items: ReadonlyArray<
      Readonly<{ glyph: string; name: string; cost: number; family: 'cluster' | 'managed' }>
    >
  }>
> = [
  {
    key: 'edge',
    label: 'Edge',
    items: [
      { glyph: 'LB', name: 'Load Balancer', cost: 120, family: 'cluster' },
      { glyph: 'CD', name: 'CDN', cost: 60, family: 'managed' },
      { glyph: 'DN', name: 'DNS', cost: 20, family: 'managed' },
    ],
  },
  {
    key: 'data',
    label: 'Data',
    items: [
      { glyph: 'PG', name: 'Postgres', cost: 310, family: 'cluster' },
      { glyph: 'CA', name: 'Cache', cost: 90, family: 'cluster' },
      { glyph: 'QU', name: 'Queue', cost: 60, family: 'managed' },
      { glyph: 'OS', name: 'Object Store', cost: 40, family: 'managed' },
    ],
  },
  {
    key: 'platform',
    label: 'Platform',
    items: [
      { glyph: 'WA', name: 'Web App', cost: 160, family: 'cluster' },
      { glyph: 'WK', name: 'Worker', cost: 90, family: 'cluster' },
      { glyph: 'MO', name: 'Monitor', cost: 30, family: 'managed' },
    ],
  },
]

export const toneText: Record<Tone, string> = {
  plain: 'text-muted-foreground',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  primary: 'text-primary-strong',
}
