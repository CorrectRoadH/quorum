/* ==========================================================================
   The catalog: every request kind, Component, instance type, runtime,
   framework, research item, Era and incident in the vertical slice (Garage
   and Pre-seed). Pure data, one module per concern. The Simulation reads it;
   the UI only displays it. Balance numbers live here and nowhere else.
   ========================================================================== */

export * from './catalog/components.ts'
export * from './catalog/economy.ts'
export * from './catalog/eras.ts'
export * from './catalog/incidents.ts'
export * from './catalog/instances.ts'
export * from './catalog/kinds.ts'
export * from './catalog/regions.ts'
export * from './catalog/research.ts'
export * from './catalog/runtimes.ts'
export * from './catalog/team.ts'
export * from './catalog/tuning.ts'
export * from './catalog/work.ts'
