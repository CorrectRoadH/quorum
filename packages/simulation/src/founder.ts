import { Effect, Result, Schema } from 'effect'
import {
  MUTATOR_IDS,
  PERKS,
  PLAYBOOK_SLOTS,
  VENTURES,
  type MutatorId,
  type PerkId,
  type ResearchId,
  type VentureId,
} from './catalog.ts'
import { Refusal } from './actions.ts'
import { HistoryRow, type ExitResult } from './exit.ts'
import { Playbook } from './playbook.ts'
import {
  MutatorId as MutatorSchema,
  ResearchId as ResearchSchema,
  VentureId as VentureSchema,
  type Founding,
} from './state.ts'

/* ==========================================================================
   The Founder (13, plan D2): the player across Companies. Legacy, perks,
   Playbooks, unlocked Ventures and Mutators, and the company history. The
   browser keeps it apart from the Company save; the Simulation never reads it,
   only the founding snapshot a new Company takes from it.
   ========================================================================== */

const withDefault = <S extends Schema.Top>(schema: S, value: S['Type']) =>
  schema.pipe(Schema.withDecodingDefaultKey(Effect.succeed(value)))

export const Founder = Schema.Struct({
  /** Legacy not spent yet. */
  legacy: withDefault(Schema.Finite, 0),
  /** Legacy earned across every Exit. */
  earned: withDefault(Schema.Finite, 0),
  perks: withDefault(Schema.Record(Schema.String, Schema.Finite), {}),
  ventures: withDefault(Schema.Array(VentureSchema), ['b2b-saas']),
  mutators: withDefault(Schema.Array(MutatorSchema), []),
  /** The next Company's Venture and Mutators. */
  venture: withDefault(VentureSchema, 'b2b-saas'),
  chosen: withDefault(Schema.Array(MutatorSchema), []),
  /** Research Institutional knowledge carries into the next Company. */
  keep: withDefault(Schema.Array(ResearchSchema), []),
  playbooks: withDefault(Schema.Array(Playbook), []),
  history: withDefault(Schema.Array(HistoryRow), []),
})
export type Founder = typeof Founder.Type

export const emptyFounder = (): Founder => Schema.decodeUnknownSync(Founder)({})

type Change = Result.Result<Founder, Refusal>
const ok = (founder: Founder): Change => Result.succeed(founder)
const no = (reason: string): Change => Result.fail(Refusal.NotAllowed({ reason }))

export const levelOf = (founder: Founder, id: PerkId): number => founder.perks[id] ?? 0

/** The next level's price, or null at the top. */
export const perkPrice = (founder: Founder, id: PerkId): number | null =>
  PERKS[id].costs[levelOf(founder, id)] ?? null

export const buyPerk = (founder: Founder, id: PerkId): Change => {
  const price = perkPrice(founder, id)
  if (price === null) return no(`${PERKS[id].name} is at its top level.`)
  if (founder.legacy < price) return no(`${PERKS[id].name} needs ${price} Legacy.`)
  return ok({
    ...founder,
    legacy: founder.legacy - price,
    perks: { ...founder.perks, [id]: levelOf(founder, id) + 1 },
  })
}

export const unlockVenture = (founder: Founder, id: VentureId): Change => {
  const def = VENTURES[id]
  if (founder.ventures.includes(id)) return ok({ ...founder, venture: id })
  if (def.bootstrapped) return no(`${def.name} opens with your first Exit.`)
  if (founder.legacy < def.cost) return no(`${def.name} needs ${def.cost} Legacy.`)
  return ok({
    ...founder,
    legacy: founder.legacy - def.cost,
    ventures: [...founder.ventures, id],
    venture: id,
  })
}

export const toggleMutator = (founder: Founder, id: MutatorId): Change => {
  if (!founder.mutators.includes(id)) return no('Mutators open with your first Exit.')
  return ok({
    ...founder,
    chosen: founder.chosen.includes(id)
      ? founder.chosen.filter((entry) => entry !== id)
      : [...founder.chosen, id],
  })
}

/** Research slots Institutional knowledge gives. */
export const keepSlots = (founder: Founder): number => levelOf(founder, 'institutional-knowledge')

export const toggleKeep = (founder: Founder, id: ResearchId): Change => {
  if (founder.keep.includes(id))
    return ok({ ...founder, keep: founder.keep.filter((x) => x !== id) })
  if (founder.keep.length >= keepSlots(founder))
    return no(
      keepSlots(founder) === 0
        ? 'Institutional knowledge keeps research through an Exit.'
        : `Keep at most ${keepSlots(founder)}.`,
    )
  return ok({ ...founder, keep: [...founder.keep, id] })
}

/** An Exit: Legacy, a history row, and from the first Exit on, Bootstrapped indie and every Mutator. */
export const recordExit = (founder: Founder, result: ExitResult): Founder => ({
  ...founder,
  legacy: founder.legacy + result.legacy,
  earned: founder.earned + result.legacy,
  history: [...founder.history, result.row],
  ventures: founder.ventures.includes('bootstrapped')
    ? founder.ventures
    : [...founder.ventures, 'bootstrapped'],
  mutators: [...MUTATOR_IDS],
  // Research kept from an earlier Company does not carry twice.
  keep: [],
})

/** What the next Company is founded with. */
export const foundingOf = (founder: Founder): Founding => ({
  venture: founder.ventures.includes(founder.venture) ? founder.venture : 'b2b-saas',
  mutators: founder.chosen.filter((id) => founder.mutators.includes(id)),
  perks: founder.perks,
})

/** Founding a Company spends the kept research. */
export const founded = (founder: Founder): Founder => ({ ...founder, keep: [] })

export const playbookSlots = (founder: Founder): number =>
  PLAYBOOK_SLOTS[levelOf(founder, 'playbooks')] ?? PLAYBOOK_SLOTS[0] ?? 1

export const savePlaybook = (founder: Founder, playbook: Playbook): Change =>
  founder.playbooks.length >= playbookSlots(founder)
    ? no(
        `Every Playbook slot is full (${playbookSlots(founder)}). Delete one, or buy more in the Legacy shop.`,
      )
    : ok({ ...founder, playbooks: [...founder.playbooks, playbook] })

export const removePlaybook = (founder: Founder, index: number): Founder => ({
  ...founder,
  playbooks: founder.playbooks.filter((_, at) => at !== index),
})
