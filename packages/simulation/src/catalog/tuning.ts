/* Playtest knobs for the vertical slice. Change these to tune a session's pace. */

/** Multiplies the user growth rate `g`, so the slice fits a 15 to 30 minute session. */
export const PLAYTEST_PACE = 2
/**
 * Mean sim seconds between Pre-seed incidents. The design's 12 minutes is too slow for a playtest.
 * Later Eras scale it by their own interval over Pre-seed's 12 minutes.
 */
export const INCIDENT_GAP = 200
/** Sim seconds from the Pre-seed raise to the first incident. */
export const FIRST_INCIDENT_AFTER = 90
/**
 * Divides the Team's calendar durations: time to hire, ramp-up, morale, deploy
 * slots, and policy changes. The design's calendar runs a day in 24 real minutes,
 * so a hire would join near the end of the slice; the live Team runs a day a minute.
 */
export const CALENDAR_PACE = 24

/** The pacing knobs the Simulation reads. The live game plays faster than the design. */
export type Tuning = Readonly<{
  /** Multiplies the user growth rate `g`. */
  pace: number
  /** Mean sim seconds between incidents. */
  incidentGap: number
  /** Sim seconds from the Pre-seed raise to the first incident. */
  firstIncidentAfter: number
  /** Divides the Team's calendar durations. Dev Hours flow at `pace`, like growth. */
  calendarPace: number
}>

/** What the live game plays at: the playtest knobs above. */
export const LIVE_TUNING: Tuning = {
  pace: PLAYTEST_PACE,
  incidentGap: INCIDENT_GAP,
  firstIncidentAfter: FIRST_INCIDENT_AFTER,
  calendarPace: CALENDAR_PACE,
}

/**
 * The design values (16 "User growth", 11 "Incident timing"). Tests and pacing
 * bots pass these to check the design's targets; the live game does not use
 * them (see the divergence log in 16).
 */
export const DESIGN_TUNING: Tuning = {
  pace: 1,
  incidentGap: 720,
  firstIncidentAfter: 600,
  calendarPace: 1,
}

/** The design's cost index per Era (16 "Cost index"). The live game uses `EraDef.costIndex`. */
export const DESIGN_COST_INDEX: ReadonlyArray<number> = [1, 1, 25, 120, 120]

/** The design's salary index per Era (16 "Cost index"). The live game uses `EraDef.salaryIndex`. */
export const DESIGN_SALARY_INDEX: ReadonlyArray<number> = [1, 1, 12, 100, 400]
