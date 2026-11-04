import { Effect, Schema } from 'effect'
import { MutatorId, VentureId } from '@quorum/simulation/state'
import type { Game } from '@quorum/simulation/state'
import { LogoId } from './logos.ts'

/* ==========================================================================
   Company files. A player keeps any number of Companies; the index names
   them, remembers their logo and Venture, and carries the few figures the
   title screen lists without decoding every file. Each Company's Game is
   written under its own key, so an autosave touches one Company only.
   ========================================================================== */

export const MAX_COMPANY_NAME = 40

/** One Company in the browser's index: the list row, and where its save lives. */
export const CompanyFile = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  logo: LogoId,
  venture: VentureId,
  mutators: Schema.Array(MutatorId),
  /** Wall-clock milliseconds. */
  createdAt: Schema.Finite,
  updatedAt: Schema.Finite,
  /** The few figures the title screen lists. */
  stage: Schema.Finite,
  users: Schema.Finite,
  time: Schema.Finite,
  /** This Company came from the single save of the build before Company files. */
  recovered: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
})
export type CompanyFile = typeof CompanyFile.Type

export const SaveIndex = Schema.Struct({
  /** The Company the title screen's Continue opens. */
  current: Schema.NullOr(Schema.String),
  companies: Schema.Array(CompanyFile),
})
export type SaveIndex = typeof SaveIndex.Type

export const EMPTY_SAVE_INDEX: SaveIndex = { current: null, companies: [] }

/** A typed name, trimmed and cut to the length the founding field allows. */
export const companyName = (name: string): string => name.trim().slice(0, MAX_COMPANY_NAME)

/** The name a Company is founded with when the player leaves the field empty. */
export const nameOr = (name: string, fallback = 'Untitled company'): string =>
  companyName(name) || fallback

/** A stable id from the Company's seed, with a suffix if that Company still exists. */
export const newSaveId = (companies: ReadonlyArray<CompanyFile>, seed: number): string => {
  const base = `c${Math.abs(Math.trunc(seed)).toString(36)}`
  const used = new Set(companies.map((file) => file.id))
  if (!used.has(base)) return base
  let suffix = 2
  while (used.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export const fileFor = (args: {
  id: string
  name: string
  logo: LogoId
  founding: Game['founding']
  game: Game
  now: number
  createdAt?: number
  recovered?: boolean
}): CompanyFile => ({
  id: args.id,
  name: args.name,
  logo: args.logo,
  venture: args.founding.venture,
  mutators: args.founding.mutators,
  createdAt: args.createdAt ?? args.now,
  updatedAt: args.now,
  stage: args.game.stage,
  users: args.game.users,
  time: args.game.time,
  recovered: args.recovered ?? false,
})

/** The file's figures brought up to the Game it just saved. */
export const refreshed = (file: CompanyFile, game: Game, now: number): CompanyFile => ({
  ...file,
  updatedAt: now,
  stage: game.stage,
  users: game.users,
  time: game.time,
})

/** The index with this file added or replaced; the order stays newest first. */
export const withFile = (index: SaveIndex, file: CompanyFile): SaveIndex => ({
  ...index,
  companies: [file, ...index.companies.filter((entry) => entry.id !== file.id)],
})

export const withoutFile = (index: SaveIndex, id: string): SaveIndex => ({
  ...index,
  current: index.current === id ? null : index.current,
  companies: index.companies.filter((entry) => entry.id !== id),
})

export const fileOf = (index: SaveIndex, id: string | null): CompanyFile | null =>
  id === null ? null : (index.companies.find((file) => file.id === id) ?? null)

/** The index with the current Company's figures brought up to the board's Game, stamped as just saved. */
export const savedIndex = (index: SaveIndex, game: Game, now: number): SaveIndex => {
  const file = fileOf(index, index.current)
  return file === null
    ? index
    : {
        ...index,
        companies: index.companies.map((entry) =>
          entry.id === file.id ? refreshed(entry, game, now) : entry,
        ),
      }
}

/** The index with the current Company's figures brought up to the board's Game. */
export const refreshedIndex = (index: SaveIndex, game: Game): SaveIndex => {
  const file = fileOf(index, index.current)
  return file === null ? index : savedIndex(index, game, file.updatedAt)
}

/** Newest first, for the Companies page. */
export const recent = (files: ReadonlyArray<CompanyFile>): ReadonlyArray<CompanyFile> =>
  [...files].sort((a, b) => b.updatedAt - a.updatedAt)

/** A Company from the build before Company files is already in the list. */
export const hasRecovered = (files: ReadonlyArray<CompanyFile>): boolean =>
  files.some((file) => file.recovered)
