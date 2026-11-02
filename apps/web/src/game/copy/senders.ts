import type { AdviceFrom } from '@quorum/simulation/goals'

/* ==========================================================================
   Who writes Mail (GDD 18, Names). Every name is a pun, and every sign is the
   footer the Inbox prints under each of their letters.
   ========================================================================== */

export type SenderKind = AdviceFrom | 'teammate' | 'security' | 'spam'

export interface SenderCopy {
  readonly kind: SenderKind
  readonly name: string
  readonly address: string
  readonly sign: string
  /** The badge colour: the real company's brand colour, so the parody reads at a glance. */
  readonly color: string
  /** A phishing copy wears the badge of the kind it pretends to be. Only the address tells. */
  readonly looks?: SenderKind
}

const sender = (
  kind: SenderKind,
  name: string,
  address: string,
  sign: string,
  color: string,
  looks?: SenderKind,
): SenderCopy => ({ kind, name, address, sign, color, ...(looks ? { looks } : {}) })

export const SENDERS: Record<string, SenderCopy> = {
  cloud: sender(
    'cloud',
    'AWOL Web Services',
    'no-reply@awol.cloud',
    'This inbox is not monitored. Neither is your bill.',
    '#FF9900',
  ),
  monitoring: sender(
    'monitoring',
    'PagerDooty',
    'alarm@pagerdooty.io',
    'You are receiving this because you are awake.',
    '#06AC38',
  ),
  vendor: sender(
    'vendor',
    'Swipe Payments',
    'billing@swipe.dev',
    'We swipe the card. Then we swipe a little more.',
    '#635BFF',
  ),
  investor: sender(
    'investor',
    'Sand Hill Road Runner Capital',
    'deals@roadrunner.vc',
    'Beep beep, and congrats on the traction.',
    '#4B5FC8',
  ),
  finance: sender(
    'finance',
    'QuickBroke Books',
    'books@quickbroke.app',
    'Reconciled to the nearest regret.',
    '#2CA01C',
  ),
  customers: sender(
    'customers',
    'Zenfail Support Desk',
    'tickets@zenfail.help',
    'Ticket #4,096. We take your feedback seriously.',
    '#2F7B80',
  ),
  mentor: sender(
    'mentor',
    'Dr. Leslie Lamportant',
    'leslie@lamport.clock',
    'Sent at an unspecified time, in an unspecified order.',
    '#008080',
  ),
  security: sender(
    'security',
    'Commonly Vulnerable & Exposed',
    'digest@cve.fyi',
    'Unsubscribe by patching.',
    '#1E6FBF',
  ),
  'cloud-gooble': sender(
    'cloud',
    'Gooble Cloud Platypus',
    'noreply@gooble.cloud',
    'We will sunset this feature in 6 to 8 weeks.',
    '#4285F4',
  ),
  'cloud-azzure': sender(
    'cloud',
    'Azzure Compute Services',
    'alerts@azzure.cloud',
    'Now in 400 regions, 3 of them up.',
    '#0078D4',
  ),
  'cloud-cloudscare': sender(
    'cloud',
    'Cloudscare',
    'noreply@cloudscare.net',
    'Verifying you are human. We have our doubts.',
    '#F38020',
  ),
  'monitoring-grafauna': sender(
    'monitoring',
    'Grafauna',
    'alerts@grafauna.dev',
    'Your graph has gone flat. That is not good.',
    '#F46800',
  ),
  'monitoring-centry': sender(
    'monitoring',
    'Centry',
    'issues@centry.io',
    'Every event counts. Every event is billed.',
    '#6C5FC7',
  ),
  'vendor-paypaul': sender(
    'vendor',
    'PayPaul',
    'service@paypaul.com',
    'Your funds are under review. Forever.',
    '#0070E0',
  ),
  'investor-sequel': sender(
    'investor',
    'Sequel Capital',
    'partners@sequel.vc',
    'Every round deserves a sequel.',
    '#00A36C',
  ),
  'investor-ycombinator': sender(
    'investor',
    'Why Combinator',
    'apply@whycombinator.vc',
    'Why not.',
    '#FF6600',
  ),
  'finance-zero': sender(
    'finance',
    'Zero Accounting',
    'books@zero.accountant',
    'Your balance, rounded to the nearest zero.',
    '#13B5EA',
  ),
  'customers-intercomatose': sender(
    'customers',
    'Intercomatose',
    'chat@intercomatose.help',
    'Typically replies in a few business decades.',
    '#1F8DED',
  ),
  'mentor-dijkstrah': sender(
    'mentor',
    'Prof. Edsger Dijkstrah',
    'edsger@shortest.path',
    'GOTO statements considered harmful, as are your SLOs.',
    '#FF7F00',
  ),
  'mentor-hoppertunity': sender(
    'mentor',
    'Grace Hoppertunity',
    'grace@nanosecond.wire',
    'Sent in the time it takes light to travel one foot.',
    '#2B5B9C',
  ),
  'security-dumpster': sender(
    'security',
    'National Vulnerability Dumpster',
    'bulletins@nvdumpster.org',
    'Every advisory is critical until proven otherwise.',
    '#3E78B2',
  ),
  'spam-datadug': sender(
    'spam',
    'Datadug',
    'sales@datadug-observe.biz',
    'Dashboards so deep you will never leave.',
    '#632CA6',
  ),
  'spam-slowflake': sender(
    'spam',
    'Slowflake Data Pillow',
    'ae@slowflake.cloud',
    'Per-second billing, per-minute regret.',
    '#29B5E8',
  ),
  'spam-devnull': sender(
    'spam',
    '/dev/null as a Service',
    'hello@devnull.wtf',
    'Fast. Durable. Webscale.',
    '#16A34A',
  ),
  'spam-awol': sender(
    'spam',
    'AWOL Web Services',
    'billing@awol-cloud.support',
    'Do not ignore this notice.',
    '#FF9900',
    'cloud',
  ),
  'spam-cve': sender(
    'spam',
    'Commonly Vulnerable & Exposed',
    'digest@cve-fyi.top',
    'Act now.',
    '#1E6FBF',
    'security',
  ),
  'spam-recruiter': sender(
    'spam',
    'Chad from TalentBro',
    'chad@talentbro.hr',
    'Let us circle back on your circle back.',
    '#0A66C2',
  ),
  'spam-azzure': sender(
    'spam',
    'Azzure Compute Services',
    'billing@azzure-invoices.top',
    'Pay within 24 hours to avoid service interruption.',
    '#0078D4',
    'cloud',
  ),
  'spam-domain': sender(
    'spam',
    'DomainGuard Registry Services',
    'renewals@domain-guard.wtf',
    'We are not your registrar, but we could be.',
    '#00A4A6',
  ),
  'spam-conf': sender(
    'spam',
    'WebScaleConf',
    'sponsors@webscale.events',
    'Where thought leaders lead thoughts.',
    '#00684A',
  ),
  'spam-incohere': sender(
    'spam',
    'Incohere',
    'hi@incohere.ai',
    'Confidently wrong, at scale.',
    '#FF7759',
  ),
}

/** Teammates draw a pun name from their id and keep it for life. Each signs in their own way. */
export const TEAMMATES: ReadonlyArray<{ readonly name: string; readonly sign: string }> = [
  { name: 'Bobby Tables', sign: "'); DROP TABLE signatures;--" },
  { name: 'Rae Condition', sign: 'Sent twice, or not at all.' },
  { name: 'Ned Pointer', sign: 'Signature: undefined' },
  { name: 'Sue Doe', sign: 'Sent with elevated privileges.' },
  { name: 'Kay Ubernetes', sign: 'Sent from pod 3 of 3. Pods 1 and 2 are pending.' },
  { name: 'Seb Fault', sign: 'Core dumped.' },
  { name: 'Pat Mutex', sign: 'Sent while holding the lock. Please reply quickly.' },
  { name: 'Dee Bugger', sign: 'Sent from a breakpoint.' },
]
