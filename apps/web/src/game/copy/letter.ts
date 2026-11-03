import type { AdviceAction, AdviceVars } from '@quorum/simulation/goals'

/* ==========================================================================
   The shape of Mail copy (GDD 18). Every Mail has several hand-written
   letters; the Inbox picks one by the Company's seed, the Thread, and the
   time, so the same news rarely reads the same way twice.
   ========================================================================== */

/** A written Mail. In `body`, a blank line starts a paragraph and a single newline breaks a line. */
export interface Written {
  readonly subject: string
  readonly body: string
}

type Nothing = Record<never, never>

/** Who wrote the letter: the Sender's display name, such as "AWOL Web Services" or "Pat Mutex". */
export interface From {
  readonly from: string
}

/** The hand-written versions of one Mail. Each one is a whole letter, with its own greeting and close. */
export type Letters<V = Nothing> = ReadonlyArray<(vars: V & From) => Written>

/** Advice: what the Simulation says about the Design now. */
export type AdviceLetters = { readonly [T in keyof AdviceVars]: Letters<AdviceVars[T]> }

type Node = { readonly node: string }

/** Step events: what just happened in the Design. */
export type EventVars = {
  readonly 'incident-instance': Node
  readonly 'incident-slow-query': Nothing
  readonly 'incident-poison': Nothing
  readonly 'incident-ddos': Nothing
  readonly 'incident-stampede': Nothing
  readonly 'incident-zone': { readonly zone: string }
  readonly 'incident-psp': Nothing
  readonly 'incident-breach': Nothing
  readonly resolved: { readonly incident: string }
  readonly 'resolved-action': { readonly incident: string; readonly action: string }
  readonly drawer: Nothing
  readonly oom: Node
  readonly credits: Node
  readonly alert: { readonly alert: string; readonly seconds: string }
  readonly 'alert-ignored': { readonly alert: string }
  readonly hired: Nothing
  readonly finished: { readonly item: string }
  readonly deployed: { readonly features: string }
  readonly 'deployed-bad': { readonly features: string }
  readonly migration: { readonly share: string }
}

export type EventTopic = keyof EventVars

/** A Step event's Mail: its topic and the values its letters quote. */
export type EventMail = {
  readonly [T in EventTopic]: { readonly topic: T; readonly vars: EventVars[T] }
}[EventTopic]

export type EventLetters = { readonly [T in EventTopic]: Letters<EventVars[T]> }

/** One kind of spam: who sends it, its buttons (a trap is `trap:<name>`), and its letters. */
export interface Pitch {
  readonly sender: string
  readonly actions?: ReadonlyArray<AdviceAction>
  readonly letters: Letters
}

/** A vulnerability the Simulation can disclose. All fictional. */
export interface Cve {
  readonly id: string
  readonly title: string
  /** One or two sentences: what the bug is, in plain words. */
  readonly what: string
}

export type CveVars = Cve & {
  readonly score: number
  readonly severity: 'critical' | 'high' | 'medium' | 'low'
  /** The Component the player runs that this affects, or null when it is not known. */
  readonly exposed: string | null
}

/** A rewrite proposal: one language, and letters from the engineer who loves it. */
export interface Rewrite {
  readonly language: string
  readonly letters: Letters
}
