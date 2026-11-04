import { Schema } from 'effect'
import { FamilyId, FrameworkId, RuntimeId } from '@quorum/simulation/state'

/** An option a Tradeoff card previews: a Stack choice or an instance family. */
export const TradeoffOption = Schema.Union([
  Schema.Struct({ kind: Schema.Literal('runtime'), id: RuntimeId }),
  Schema.Struct({ kind: Schema.Literal('framework'), id: FrameworkId }),
  Schema.Struct({ kind: Schema.Literal('family'), id: FamilyId }),
])
export type TradeoffOption = typeof TradeoffOption.Type
