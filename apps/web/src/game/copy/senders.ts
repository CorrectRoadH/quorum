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
}

const sender = (kind: SenderKind, name: string, address: string, sign: string): SenderCopy => ({
  kind,
  name,
  address,
  sign,
})

export const SENDERS: Record<string, SenderCopy> = {
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
  vendor: sender(
    'vendor',
    'Swipe Payments',
    'billing@swipe.dev',
    'We swipe the card. Then we swipe a little more.',
  ),
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
  'cloud-cloudscare': sender(
    'cloud',
    'Cloudscare',
    'noreply@cloudscare.net',
    'Verifying you are human. We have our doubts.',
  ),
  'monitoring-grafauna': sender(
    'monitoring',
    'Grafauna',
    'alerts@grafauna.dev',
    'Your graph has gone flat. That is not good.',
  ),
  'monitoring-centry': sender(
    'monitoring',
    'Centry',
    'issues@centry.io',
    'Every event counts. Every event is billed.',
  ),
  'vendor-paypaul': sender(
    'vendor',
    'PayPaul',
    'service@paypaul.com',
    'Your funds are under review. Forever.',
  ),
  'investor-sequel': sender(
    'investor',
    'Sequel Capital',
    'partners@sequel.vc',
    'Every round deserves a sequel.',
  ),
  'investor-ycombinator': sender(
    'investor',
    'Why Combinator',
    'apply@whycombinator.vc',
    'Why not.',
  ),
  'finance-zero': sender(
    'finance',
    'Zero Accounting',
    'books@zero.accountant',
    'Your balance, rounded to the nearest zero.',
  ),
  'customers-intercomatose': sender(
    'customers',
    'Intercomatose',
    'chat@intercomatose.help',
    'Typically replies in a few business decades.',
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
  'spam-azzure': sender(
    'spam',
    'Azzure Compute Services',
    'billing@azzure-invoices.top',
    'Pay within 24 hours to avoid service interruption.',
  ),
  'spam-domain': sender(
    'spam',
    'DomainGuard Registry Services',
    'renewals@domain-guard.wtf',
    'We are not your registrar, but we could be.',
  ),
  'spam-conf': sender(
    'spam',
    'WebScaleConf',
    'sponsors@webscale.events',
    'Where thought leaders lead thoughts.',
  ),
  'spam-incohere': sender('spam', 'Incohere', 'hi@incohere.ai', 'Confidently wrong, at scale.'),
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
