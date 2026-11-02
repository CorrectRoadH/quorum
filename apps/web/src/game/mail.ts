import type { Advice, AdviceAction } from '@quorum/simulation/goals'
import type { Game } from '@quorum/simulation/state'
import { COMPONENTS } from '@quorum/simulation/catalog'
import {
  ADVICE,
  CVE_LETTERS,
  CVES,
  EVENTS,
  HIRE,
  REWRITES,
  SENDERS,
  SPAM,
  TEAMMATES,
  TICKETS,
  type Cve,
  type CveVars,
  type EventMail,
  type Letters,
  type Pitch,
  type SenderKind,
  type Written,
} from './copy/index.ts'

/* ==========================================================================
   Mail (GDD 18): who writes, and which of their letters they send. The copy
   lives in `copy/`; this file picks a Sender and a letter for each fact.
   ========================================================================== */

export type { SenderKind } from './copy/index.ts'

export interface Sender {
  readonly name: string
  readonly address: string
  readonly kind: SenderKind
  /** The colour: the avatar, the row's left bar, and the label chip. */
  readonly hue: number
  readonly sign: string
}

export const KIND_LABEL: Record<SenderKind, string> = {
  cloud: 'Cloud',
  monitoring: 'Alerts',
  vendor: 'Vendor',
  investor: 'Investor',
  finance: 'Finance',
  customers: 'Customer',
  mentor: 'Mentor',
  teammate: 'Team',
  security: 'Security',
  spam: 'Spam',
}

/** One fixed hue per kind; a teammate's hue drifts a little, so no two match. */
const HUE: Record<SenderKind, number> = {
  cloud: 245,
  monitoring: 75,
  vendor: 345,
  investor: 305,
  finance: 220,
  customers: 205,
  mentor: 285,
  teammate: 150,
  security: 25,
  spam: 0,
}

const hashOf = (...parts: ReadonlyArray<number | string>): number => {
  let hash = 0x81_1c_9d_c5
  for (const char of parts.join(':')) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 0x01_00_01_93) >>> 0
  }
  return hash
}

/** One of `items`, the same for the same parts. */
const pick = <A>(items: ReadonlyArray<A>, ...parts: ReadonlyArray<number | string>): A =>
  items[hashOf(...parts) % items.length] as A

export const senderOf = (id: string): Sender => {
  const known = SENDERS[id]
  if (known) return { ...known, hue: HUE[known.kind] }
  const mate = pick(TEAMMATES, id.replace('mate:', ''))
  return {
    kind: 'teammate',
    name: mate.name,
    address: `${mate.name.toLowerCase().replace(/[^a-z]+/g, '.')}@quorum.team`,
    hue: HUE.teammate + (hashOf(id) % 5) * 9 - 18,
    sign: mate.sign,
  }
}

/** Several parties can write about the same thing. A Thread draws its Sender from the pool
 *  by the Company's seed and the Thread's key, so it is stable for one Thread and varied across them. */
const POOLS: Record<SenderKind, ReadonlyArray<string>> = {
  cloud: ['cloud', 'cloud-gooble', 'cloud-azzure'],
  monitoring: ['monitoring', 'monitoring-grafauna', 'monitoring-centry'],
  vendor: ['vendor', 'vendor-paypaul'],
  investor: ['investor', 'investor-sequel', 'investor-ycombinator'],
  finance: ['finance', 'finance-zero'],
  customers: ['customers', 'customers-intercomatose'],
  mentor: ['mentor', 'mentor-dijkstrah', 'mentor-hoppertunity'],
  security: ['security', 'security-dumpster'],
  teammate: ['mentor'],
  spam: ['spam-datadug'],
}

export const senderFor = (kind: SenderKind, game: Game, key: string): string => {
  const pool = POOLS[kind]
  return pool[hashOf(game.seed, key) % pool.length] ?? kind
}

/**
 * One letter from `letters`, signed by `sender`. The pick hashes the Company's seed, the
 * Thread, and the time, so every device writes the same Mail and a Thread rarely repeats itself.
 */
const write = <V>(
  letters: Letters<V>,
  vars: V,
  sender: string,
  game: Game,
  key: string,
  salt: number | string = '',
): Written =>
  pick(letters, game.seed, key, game.time, salt)({ ...vars, from: senderOf(sender).name })

/** What a Mail carries, before the Inbox stores it. */
export interface Fact {
  /** The thing it is about: a repeat with the same key joins its Thread. */
  readonly key: string
  /** The Sender's id: a key of SENDERS, or `mate:<engineer id>`. */
  readonly sender: string
  readonly subject: string
  /** The body. A blank line starts a paragraph. */
  readonly text: string
  readonly actions: ReadonlyArray<AdviceAction>
  /** The filter put it in Spam. */
  readonly spam: boolean
}

const fact = (
  key: string,
  sender: string,
  written: Written,
  actions: ReadonlyArray<AdviceAction> = [],
  spam = false,
): Fact => ({ key, sender, subject: written.subject, text: written.body, actions, spam })

export const factOf = (advice: Advice, game: Game, salt: number | string = ''): Fact => {
  const sender = senderFor(advice.from, game, advice.key)
  // The Simulation pairs each topic with its own vars; the record type cannot say so.
  const letters = ADVICE[advice.topic] as unknown as Letters<Advice['vars']>
  return fact(advice.key, sender, write(letters, advice.vars, sender, game, advice.key, salt), [
    ...advice.actions,
  ])
}

/* ---------- the world writes: teammates, CVEs, spam ---------- */

/** One event is drawn per this many sim seconds. */
export const EVENT_EVERY = 45

const severity = (score: number): CveVars['severity'] =>
  score >= 9 ? 'critical' : score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low'

const cveFact = (cve: Cve, game: Game, spam: boolean, at: number): Fact => {
  const node = game.nodes[at % Math.max(1, game.nodes.length)]
  const key = `security:${cve.id}`
  const sender = senderFor('security', game, cve.id)
  const vars: CveVars = {
    ...cve,
    severity: severity(cve.score),
    exposed: node ? COMPONENTS[node.type].name : null,
  }
  return fact(
    key,
    sender,
    write(CVE_LETTERS, vars, sender, game, key, at),
    node ? [{ id: `show:${node.id}`, label: 'Show on Board' }] : [],
    // A real advisory can land in Spam, where the filter put it.
    spam,
  )
}

const mateOf = (game: Game, at: number): string =>
  `mate:${game.engineers[at % Math.max(1, game.engineers.length)]?.id ?? `e${at % 8}`}`

const hireFact = (game: Game, mate: string, salt: number): Fact => {
  const key = `team:hire:${game.engineers.length}`
  const backlog = String(Math.max(3, game.backlog.length))
  return fact(key, mate, write(HIRE, { backlog }, mate, game, key, salt), [
    { id: 'hire', label: 'Approve hire' },
    { id: 'later', label: 'Later' },
  ])
}

const rewriteFact = (game: Game, mate: string, salt: number): Fact => {
  const key = `team:rewrite:${mate}`
  // An engineer falls for one language and stays with it.
  const rewrite = pick(REWRITES, mate, 'rewrite')
  return fact(key, mate, write(rewrite.letters, {}, mate, game, key, salt), [
    { id: 'team', label: 'Open Team' },
    { id: 'decline', label: 'Decline' },
  ])
}

const customerFact = (game: Game, n: number): Fact => {
  const key = 'customers:slow'
  const sender = senderFor('customers', game, `slow:${n}`)
  return fact(key, sender, write(TICKETS, {}, sender, game, key, n))
}

const spamFact = (pitch: Pitch, game: Game, salt: number): Fact => {
  const key = `spam:${pitch.sender}`
  return fact(
    key,
    pitch.sender,
    write(pitch.letters, {}, pitch.sender, game, key, salt),
    pitch.actions,
    true,
  )
}

/**
 * What the world writes at one event tick: a CVE, a teammate, a customer, or
 * spam. Drawn from the Company's seed, so it is the same on every device.
 * Mail changes nothing in the Simulation until the player presses a button.
 */
export const eventMail = (game: Game, bucket: number): Fact | null => {
  const draw = hashOf(game.seed, bucket)
  const roll = draw % 100
  const at = draw >>> 8
  const mate = game.engineers.length > 0 ? mateOf(game, at) : null

  if (roll < 15 && game.nodes.length > 0) return cveFact(pick(CVES, at), game, draw % 10 === 0, at)
  if (roll < 30 && mate)
    return game.backlog.length >= 3 && game.hires.length === 0
      ? hireFact(game, mate, at)
      : rewriteFact(game, mate, at)
  if (roll < 40 && game.apdex < 0.9) return customerFact(game, at)
  if (roll < 85) return spamFact(pick(SPAM, at), game, at)
  return null
}

/* ---------- the generator: every kind of Mail on demand (Sandbox) ---------- */

export interface Sample {
  readonly id: string
  readonly label: string
  /** `n` is unique per send, so each one starts its own Thread unless the sample repeats a key. */
  readonly make: (game: Game, n: number) => Fact
}

const adviceSample = (id: string, label: string, make: (n: number) => Advice): Sample => ({
  id,
  label,
  make: (game, n) => factOf(make(n), game, n),
})

const own = (fact: Fact, n: number): Fact => ({ ...fact, key: `${fact.key}#${n}` })

export const SAMPLES: ReadonlyArray<Sample> = [
  {
    id: 'random',
    label: 'A random event',
    make: (game, n) => eventMail(game, n) ?? spamFact(SPAM[0]!, game, n),
  },
  adviceSample('cloud', 'Cloud: out of memory', (n) => ({
    key: `cloud:memory#${n}`,
    from: 'cloud',
    subject: 'App Server: out of memory, swapping',
    text: 'App Server is out of RAM and swapping.',
    topic: 'memory',
    vars: { node: 'App Server' },
    actions: [],
  })),
  adviceSample('monitoring', 'Alerts: node failed', (n) => ({
    key: `monitoring:failed#${n}`,
    from: 'monitoring',
    subject: 'Database failed',
    text: 'Database failed.',
    topic: 'failed',
    vars: { node: 'Database' },
    actions: [],
  })),
  adviceSample('vendor', 'Vendor: drawer full', (n) => ({
    key: `vendor:drawer#${n}`,
    from: 'vendor',
    subject: 'Your payout drawer is full',
    text: 'The Payments drawer is full.',
    topic: 'drawer',
    vars: {},
    actions: [],
  })),
  adviceSample('investor', 'Investor: term sheet', (n) => ({
    key: `investor:round#${n}`,
    from: 'investor',
    subject: 'Seed term sheet',
    text: 'Investors are calling.',
    topic: 'round',
    vars: { round: 'Seed' },
    actions: [
      { id: 'raise', label: 'Raise' },
      { id: 'decline', label: 'Decline' },
    ],
  })),
  adviceSample('finance', 'Finance: negative cash', (n) => ({
    key: `finance:negative#${n}`,
    from: 'finance',
    subject: 'Your balance is negative',
    text: 'Cash is negative.',
    topic: 'negative',
    vars: {},
    actions: [],
  })),
  adviceSample('mentor', 'Mentor: spend Insight', (n) => ({
    key: `mentor:research#${n}`,
    from: 'mentor',
    subject: 'You are sitting on Insight',
    text: 'Open Research and spend your Insight.',
    topic: 'research',
    vars: {},
    actions: [],
  })),
  adviceSample('thread', 'Repeating thread (same key)', () => ({
    key: 'cloud:cpu:sandbox',
    from: 'cloud',
    subject: 'App Server: CPU at 100%',
    text: 'App Server is out of CPU.',
    topic: 'cpu',
    vars: { node: 'App Server' },
    actions: [],
  })),
  ...CVES.map((cve): Sample => ({
    id: `cve-${cve.id}`,
    label: `CVE: ${cve.id}`,
    make: (game, n) => own(cveFact(cve, game, false, n), n),
  })),
  {
    id: 'cve-spam',
    label: 'CVE misfiled in Spam',
    make: (game, n) => own(cveFact(CVES[0]!, game, true, n), n),
  },
  {
    id: 'hire',
    label: 'Teammate: hire request',
    make: (game, n) => own(hireFact(game, mateOf(game, n), n), n),
  },
  {
    id: 'rewrite',
    label: 'Teammate: rewrite proposal',
    make: (game, n) => own(rewriteFact(game, mateOf(game, n), n), n),
  },
  {
    id: 'customer',
    label: 'Customer: it is slow',
    make: (game, n) => own(customerFact(game, n), n),
  },
  ...SPAM.map((pitch): Sample => ({
    id: pitch.sender,
    label: `Spam: ${SENDERS[pitch.sender]?.name ?? pitch.sender}`,
    make: (game, n) => own(spamFact(pitch, game, n), n),
  })),
]

/* ---------- Step events: what happened in the Design, as Mail ---------- */

const EVENT_FROM: Record<string, SenderKind> = {
  CreditsExhausted: 'cloud',
  OutOfMemory: 'cloud',
  DrawerFull: 'vendor',
  AlertFired: 'monitoring',
  AlertIgnored: 'monitoring',
  IncidentStarted: 'monitoring',
  IncidentResolved: 'monitoring',
  MigrationShifted: 'monitoring',
}

/** News only one party would send: the edge network sees a flood before anyone else. */
const PINNED: Partial<Record<EventMail['topic'], string>> = { 'incident-ddos': 'cloud-cloudscare' }

/** One Step event as Mail: the party that would know writes, and repeats join the Thread. */
export const eventFact = (
  event: { readonly _tag: string; readonly [field: string]: unknown },
  mail: EventMail,
  game: Game,
): Fact => {
  const about =
    [event.nodeId, event.rule, event.engineerId].find((v) => typeof v === 'string') ?? ''
  // Each kind of news keeps its own Thread: a zone outage does not join a cache stampede.
  const key = `event:${mail.topic}:${about}`
  const from = EVENT_FROM[event._tag]
  const sender =
    PINNED[mail.topic] ??
    (from
      ? senderFor(from, game, key)
      : `mate:${typeof event.engineerId === 'string' ? event.engineerId : (game.engineers[0]?.id ?? 'e0')}`)
  // Each topic carries its own vars; the record type cannot say so.
  const letters = EVENTS[mail.topic] as unknown as Letters<EventMail['vars']>
  return fact(key, sender, write(letters, mail.vars, sender, game, key))
}
