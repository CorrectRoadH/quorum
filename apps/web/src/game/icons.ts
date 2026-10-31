import {
  Activity,
  ChartLine,
  Combine,
  Cpu,
  CreditCard,
  Database,
  DatabaseBackup,
  Globe,
  type IconNode,
  KeyRound,
  Server,
  Split,
  Users,
  Zap,
} from 'lucide'
import type { BuildGroup, ComponentId } from './engine/catalog.ts'

/** One glyph per Component, shared by the board, the dock and the inspector. */
export const COMPONENT_ICONS: Record<ComponentId, IconNode> = {
  users: Users,
  payments: CreditCard,
  analytics: ChartLine,
  server: Server,
  database: Database,
  dns: Globe,
  lb: Split,
  pooler: Combine,
  cache: Zap,
  replica: DatabaseBackup,
  auth: KeyRound,
}

export const GROUP_ICONS: Record<BuildGroup, IconNode> = {
  edge: Globe,
  compute: Cpu,
  data: Database,
  ops: Activity,
}
