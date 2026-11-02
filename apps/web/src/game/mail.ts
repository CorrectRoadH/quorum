import type { Advice, AdviceAction, AdviceFrom } from '@quorum/simulation/goals'
import type { Game } from '@quorum/simulation/state'
import { COMPONENTS } from '@quorum/simulation/catalog'

/* ==========================================================================
   Mail content (GDD 18): the Senders, and the events that are not facts about
   the Design: teammates, CVEs, spam. All names are fictional puns.
   ========================================================================== */

export type SenderKind = AdviceFrom | 'teammate' | 'security' | 'spam'

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

const sender = (kind: SenderKind, name: string, address: string, sign: string): Sender => ({
  kind,
  name,
  address,
  hue: HUE[kind],
  sign,
})

export const SENDERS: Record<string, Sender> = {
  cloud: sender(
    'cloud',
    'AWOL Web Services',
    'no-reply@awol.cloud',
    'This inbox is not monitored. Neither is your bill.',
  ),
  monitoring: sender(
    'monitoring',
    'PagerDooty',
    'alarm@pagerdooty.io',
    'You are receiving this because you are awake.',
  ),
  vendor: sender('vendor', 'Strype Payments', 'billing@strype.dev', 'Fees are subject to fees.'),
  investor: sender(
    'investor',
    'Sand Hill Road Runner Capital',
    'deals@roadrunner.vc',
    'Beep beep, and congrats on the traction.',
  ),
  finance: sender(
    'finance',
    'QuickBroke Books',
    'books@quickbroke.app',
    'Reconciled to the nearest regret.',
  ),
  customers: sender(
    'customers',
    'Zenfail Support Desk',
    'tickets@zenfail.help',
    'Ticket #4,096. We take your feedback seriously.',
  ),
  mentor: sender(
    'mentor',
    'Dr. Leslie Lamportant',
    'leslie@lamport.clock',
    'Sent at an unspecified time, in an unspecified order.',
  ),
  security: sender(
    'security',
    'Commonly Vulnerable & Exposed',
    'digest@cve.fyi',
    'Unsubscribe by patching.',
  ),
  'cloud-gooble': sender(
    'cloud',
    'Gooble Cloud Platypus',
    'noreply@gooble.cloud',
    'We will sunset this feature in 6 to 8 weeks.',
  ),
  'cloud-azzure': sender(
    'cloud',
    'Azzure Compute Services',
    'alerts@azzure.cloud',
    'Now in 400 regions, 3 of them up.',
  ),
  'monitoring-grafauna': sender(
    'monitoring',
    'Grafauna',
    'alerts@grafauna.dev',
    'Your graph has gone flat. That is not good.',
  ),
  'monitoring-sentri': sender(
    'monitoring',
    'Sentri',
    'issues@sentri.watch',
    'We saw it first. You saw it last.',
  ),
  'vendor-paypaul': sender(
    'vendor',
    'PayPaul',
    'service@paypaul.com',
    'Your funds are under review. Forever.',
  ),
  'investor-sequoyah': sender(
    'investor',
    'Sequoyah Capital',
    'partners@sequoyah.vc',
    'We lead rounds. We also follow, at a distance.',
  ),
  'investor-ycombinator': sender(
    'investor',
    'Why Combinator',
    'apply@whycombinator.vc',
    'Why not.',
  ),
  'finance-xeroxed': sender(
    'finance',
    'Xeroxed Accounting',
    'invoices@xeroxed.app',
    'A copy of a copy of your ledger.',
  ),
  'customers-intercomm': sender(
    'customers',
    'Intercomm Chat',
    'chat@intercomm.help',
    'Typing... Typing... Typing...',
  ),
  'mentor-dijkstrah': sender(
    'mentor',
    'Prof. Edsger Dijkstrah',
    'edsger@shortest.path',
    'GOTO statements considered harmful, as are your SLOs.',
  ),
  'mentor-hoppertunity': sender(
    'mentor',
    'Grace Hoppertunity',
    'grace@nanosecond.wire',
    'Sent in the time it takes light to travel one foot.',
  ),
  'security-dumpster': sender(
    'security',
    'National Vulnerability Dumpster',
    'bulletins@nvdumpster.org',
    'Every advisory is critical until proven otherwise.',
  ),
  'spam-datadug': sender(
    'spam',
    'Datadug',
    'sales@datadug-observe.biz',
    'Dashboards so deep you will never leave.',
  ),
  'spam-slowflake': sender(
    'spam',
    'Slowflake Data Pillow',
    'ae@slowflake.cloud',
    'Per-second billing, per-minute regret.',
  ),
  'spam-devnull': sender(
    'spam',
    '/dev/null as a Service',
    'hello@devnull.wtf',
    'Fast. Durable. Webscale.',
  ),
  'spam-awol': sender(
    'spam',
    'AWOL Web Services',
    'billing@awol-cloud.support',
    'Do not ignore this notice.',
  ),
  'spam-cve': sender('spam', 'Commonly Vulnerable & Exposed', 'digest@cve-fyi.top', 'Act now.'),
  'spam-recruiter': sender(
    'spam',
    'Chad from TalentBro',
    'chad@talentbro.hr',
    'Let us circle back on your circle back.',
  ),
}

/** Teammates get a pun name from their id, and keep it for life. */
const TEAMMATES = [
  'Bobby Tables',
  'Rae Condition',
  'Ned Pointer',
  'Sue Doe',
  'Kay Ubernetes',
  'Seb Fault',
  'Pat Mutex',
  'Dee Bugger',
]

const hashOf = (...parts: ReadonlyArray<number | string>): number => {
  let hash = 0x81_1c_9d_c5
  for (const char of parts.join(':')) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 0x01_00_01_93) >>> 0
  }
  return hash
}

const teammateName = (id: string): string => TEAMMATES[hashOf(id) % TEAMMATES.length] ?? id

export const senderOf = (id: string): Sender => {
  const known = SENDERS[id]
  if (known) return known
  const name = teammateName(id.replace('mate:', ''))
  return {
    kind: 'teammate',
    name,
    address: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@quorum.team`,
    hue: HUE.teammate + (hashOf(id) % 5) * 9 - 18,
    sign: 'Sent from my standing desk',
  }
}

/** Several parties can write about the same thing. A Thread draws its Sender from the pool
 *  by the Company's seed and the Thread's key, so it is stable for one Thread and varied across them. */
const POOLS: Record<SenderKind, ReadonlyArray<string>> = {
  cloud: ['cloud', 'cloud-gooble', 'cloud-azzure'],
  monitoring: ['monitoring', 'monitoring-grafauna', 'monitoring-sentri'],
  vendor: ['vendor', 'vendor-paypaul'],
  investor: ['investor', 'investor-sequoyah', 'investor-ycombinator'],
  finance: ['finance', 'finance-xeroxed'],
  customers: ['customers', 'customers-intercomm'],
  mentor: ['mentor', 'mentor-dijkstrah', 'mentor-hoppertunity'],
  security: ['security', 'security-dumpster'],
  teammate: ['mentor'],
  spam: ['spam-datadug'],
}

export const senderFor = (kind: SenderKind, game: Game, key: string): string => {
  const pool = POOLS[kind]
  return pool[hashOf(game.seed, key) % pool.length] ?? kind
}

/** What a Mail carries, before the Inbox stores it. */
export interface Fact {
  /** The thing it is about: a repeat with the same key joins its Thread. */
  readonly key: string
  /** The Sender's id: a key of SENDERS, or `mate:<engineer id>`. */
  readonly sender: string
  readonly subject: string
  readonly text: string
  readonly actions: ReadonlyArray<AdviceAction>
  /** The filter put it in Spam. */
  readonly spam: boolean
}

export const factOf = (advice: Advice, game: Game): Fact => ({
  key: advice.key,
  sender: senderFor(advice.from, game, advice.key),
  subject: advice.subject,
  text: advice.text,
  actions: advice.actions,
  spam: false,
})

/* ---------- the world writes: teammates, CVEs, spam ---------- */

/** One event is drawn per this many sim seconds. */
export const EVENT_EVERY = 45

const SPAM: ReadonlyArray<{
  sender: string
  subject: string
  text: string
  actions?: ReadonlyArray<AdviceAction>
}> = [
  {
    sender: 'spam-datadug',
    subject: '10x your observability: book a demo',
    text: 'We noticed you have logs. Our platform turns them into dashboards that turn into invoices. Book a 30 minute demo with an Account Executive who will not listen.',
  },
  {
    sender: 'spam-slowflake',
    subject: 'Your data deserves a pillow',
    text: 'Move your 4 GB Postgres to the Slowflake Data Pillow and enjoy infinite scale you will never need. First 3 minutes free.',
  },
  {
    sender: 'spam-devnull',
    subject: 'Webscale writes, guaranteed',
    text: 'Write throughput of 10 million ops per second. Reads are an enterprise feature.',
  },
  {
    sender: 'spam-awol',
    subject: 'Action required: verify your AWOL account in 24 h',
    text: 'Your account will be suspended unless you verify your credentials. Click below to sign in.',
    actions: [{ id: 'trap:phish', label: 'Verify account' }],
  },
  {
    sender: 'spam-cve',
    subject: 'CVE-2099-0001: critical, patch now',
    text: 'A critical flaw affects everything, including you. Run the attached patcher as root to fix it.',
    actions: [{ id: 'trap:patcher', label: 'Patch now' }],
  },
  {
    sender: 'spam-recruiter',
    subject: 'Saw your engineers on LinkedIn',
    text: 'I have a rockstar opportunity for your team at a company with the same salary band and more beanbags. Can I get 15 minutes?',
  },
]

const CVES: ReadonlyArray<{ id: string; subject: string; text: string; score: number }> = [
  {
    id: 'CVE-2026-1337',
    score: 9.8,
    subject: 'HTTP proxy request smuggling',
    text: 'A request smuggling bug lets a caller reach routes the proxy was meant to hide.',
  },
  {
    id: 'CVE-2026-0451',
    score: 7.5,
    subject: 'Framework deserializes anything you give it',
    text: 'A deserialization bug runs code from a crafted cookie. The vendor calls this a feature.',
  },
  {
    id: 'CVE-2026-2718',
    score: 8.1,
    subject: 'Database engine remote code',
    text: 'A malformed query packet runs code on the database host before authentication.',
  },
  {
    id: 'CVE-2026-0042',
    score: 5.3,
    subject: 'Package your package depends on leaks memory',
    text: 'A package your package depends on prints a little too much of the heap.',
  },
]

const cveFact = (cve: (typeof CVES)[number], game: Game, spam: boolean, at: number): Fact => {
  const node = game.nodes[at % Math.max(1, game.nodes.length)]
  return {
    key: `security:${cve.id}`,
    sender: senderFor('security', game, cve.id),
    subject: `${cve.id}: ${cve.subject}`,
    text: node
      ? `${cve.text} Score ${cve.score}. You run software this affects: ${COMPONENTS[node.type].name}.`
      : `${cve.text} Score ${cve.score}.`,
    actions: node ? [{ id: `show:${node.id}`, label: 'Show on Board' }] : [],
    // A real advisory can land in Spam, where the filter put it.
    spam,
  }
}

const mateOf = (game: Game, at: number): string =>
  `mate:${game.engineers[at % Math.max(1, game.engineers.length)]?.id ?? `e${at % 8}`}`

const hireFact = (game: Game, mate: string): Fact => ({
  key: `team:hire:${game.engineers.length}`,
  sender: mate,
  subject: 'We need another engineer',
  text: `The backlog is ${Math.max(3, game.backlog.length)} items deep and we are all working on the same three. Can we hire?`,
  actions: [
    { id: 'hire', label: 'Approve hire' },
    { id: 'later', label: 'Later' },
  ],
  spam: false,
})

const rewriteFact = (mate: string): Fact => ({
  key: `team:rewrite:${mate}`,
  sender: mate,
  subject: 'Proposal: rewrite it in Rust',
  text: 'I read a blog post. It says we would save servers. I estimate two weeks. I estimated the last one at two days.',
  actions: [
    { id: 'team', label: 'Open Team' },
    { id: 'decline', label: 'Decline' },
  ],
  spam: false,
})

const customerFact = (game: Game, n: number): Fact => ({
  key: 'customers:slow',
  sender: senderFor('customers', game, `slow:${n}`),
  subject: 'Ticket #4096: it is slow',
  text: 'Karen from Procurement says the page takes forever, and that she will escalate to your CEO. You are the CEO.',
  actions: [],
  spam: false,
})

const spamFact = (pitch: (typeof SPAM)[number]): Fact => ({
  key: `spam:${pitch.sender}`,
  sender: pitch.sender,
  subject: pitch.subject,
  text: pitch.text,
  actions: pitch.actions ?? [],
  spam: true,
})

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

  if (roll < 15 && game.nodes.length > 0)
    return cveFact(CVES[at % CVES.length] as (typeof CVES)[number], game, draw % 10 === 0, at)
  if (roll < 30 && mate)
    return game.backlog.length >= 3 && game.hires.length === 0
      ? hireFact(game, mate)
      : rewriteFact(mate)
  if (roll < 40 && game.apdex < 0.9) return customerFact(game, at)
  if (roll < 85) return spamFact(SPAM[at % SPAM.length] as (typeof SPAM)[number])
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
  make: (game, n) => factOf(make(n), game),
})

const own = (fact: Fact, n: number): Fact => ({ ...fact, key: `${fact.key}#${n}` })

export const SAMPLES: ReadonlyArray<Sample> = [
  {
    id: 'random',
    label: 'A random event',
    make: (game, n) => eventMail(game, n) ?? spamFact(SPAM[0]!),
  },
  adviceSample('cloud', 'Cloud: out of memory', (n) => ({
    key: `cloud:memory#${n}`,
    from: 'cloud',
    subject: 'App Server: out of memory, swapping',
    text: 'App Server is out of RAM and swapping. Resize it, pick the Memory family, or shrink the pool.',
    actions: [],
  })),
  adviceSample('monitoring', 'Alerts: node failed', (n) => ({
    key: `monitoring:failed#${n}`,
    from: 'monitoring',
    subject: 'Database failed',
    text: 'Database failed. Select it and click Replace, or wait for the provider.',
    actions: [],
  })),
  adviceSample('vendor', 'Vendor: drawer full', (n) => ({
    key: `vendor:drawer#${n}`,
    from: 'vendor',
    subject: 'Your payout drawer is full',
    text: 'The Payments drawer is full and revenue is spilling. Click Payments to collect.',
    actions: [],
  })),
  adviceSample('investor', 'Investor: term sheet', (n) => ({
    key: `investor:round#${n}`,
    from: 'investor',
    subject: 'Seed term sheet',
    text: 'Investors are calling. Take or decline the Seed round.',
    actions: [
      { id: 'raise', label: 'Raise' },
      { id: 'decline', label: 'Decline' },
    ],
  })),
  adviceSample('finance', 'Finance: negative cash', (n) => ({
    key: `finance:negative#${n}`,
    from: 'finance',
    subject: 'Your balance is negative',
    text: 'Cash is negative. Sell Nodes you do not need, or grow revenue.',
    actions: [],
  })),
  adviceSample('mentor', 'Mentor: spend Insight', (n) => ({
    key: `mentor:research#${n}`,
    from: 'mentor',
    subject: 'You are sitting on Insight',
    text: 'Open Research and spend your Insight.',
    actions: [],
  })),
  {
    id: 'thread',
    label: 'Repeating thread (same key)',
    make: (_game, n) => ({
      key: 'cloud:cpu:sandbox',
      sender: 'cloud',
      subject: 'App Server: CPU at 100%',
      text: `App Server is out of CPU (reading ${n}). Resize it, or add a copy behind a Load Balancer.`,
      actions: [],
      spam: false,
    }),
  },
  ...CVES.map((cve, index): Sample => ({
    id: `cve-${index}`,
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
    make: (game, n) => own(hireFact(game, mateOf(game, n)), n),
  },
  {
    id: 'rewrite',
    label: 'Teammate: rewrite proposal',
    make: (game, n) => own(rewriteFact(mateOf(game, n)), n),
  },
  {
    id: 'customer',
    label: 'Customer: it is slow',
    make: (game, n) => own(customerFact(game, n), n),
  },
  ...SPAM.map((pitch, index): Sample => ({
    id: `spam-${index}`,
    label: `Spam: ${pitch.subject.slice(0, 34)}`,
    make: (_game, n) => own(spamFact(pitch), n),
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

/** One Step event as Mail: the party that would know writes, and repeats join the Thread. */
export const eventFact = (
  event: { readonly _tag: string; readonly [field: string]: unknown },
  text: string,
  game: Game,
): Fact => {
  const about =
    [event.nodeId, event.rule, event.engineerId].find((v) => typeof v === 'string') ?? ''
  const key = `event:${event._tag}:${about}`
  const from = EVENT_FROM[event._tag]
  const sender = from
    ? senderFor(from, game, key)
    : `mate:${typeof event.engineerId === 'string' ? event.engineerId : (game.engineers[0]?.id ?? 'e0')}`
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text
  return { key, sender, subject: sentence.replace(/\.$/, ''), text, actions: [], spam: false }
}
