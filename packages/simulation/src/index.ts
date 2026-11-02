/* ==========================================================================
   The Simulation: the pure model of a Company. The browser plays it and the
   API Worker replays it, so it imports only `effect` and its own files
   (docs/adr/0004-simulation-package.md). Each module is also importable on
   its own, as `@template/simulation/<module>`.
   ========================================================================== */

export * from './actions.ts'
export * from './capacity.ts'
export * from './challenges.ts'
export * from './catalog.ts'
export * from './company.ts'
export * from './director.ts'
export * from './distribution.ts'
export * from './events.ts'
export * from './goals.ts'
export * from './hash.ts'
export * from './ipo.ts'
export * from './ledger.ts'
export * from './lookups.ts'
export * from './preview.ts'
export * from './quarters.ts'
export * from './random.ts'
export * from './replay.ts'
export * from './regions.ts'
export * from './rules.ts'
export * from './sandbox.ts'
export * from './solve.ts'
// The id schemas (`ComponentId` and the others) share their names with the
// catalog's id types; import them from `@template/simulation/state`.
export {
  AlertRules,
  Alarms,
  CacheEngine,
  DEFAULT_ALERT_RULES,
  DownCause,
  FalseAlarms,
  Game,
  GameLink,
  GameNode,
  Incident,
  LbPolicy,
  NO_FALSE_ALARMS,
  PmMode,
  Postmortem,
  RequestKindId,
  Retries,
  Sample,
} from './state.ts'
export * from './step.ts'
export * from './valuation.ts'
export * from './version.ts'
