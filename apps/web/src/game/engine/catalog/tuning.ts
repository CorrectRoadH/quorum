/* Playtest knobs for the vertical slice. Change these to tune a session's pace. */

/** Multiplies the user growth rate `g`, so the slice fits a 15 to 30 minute session. */
export const PLAYTEST_PACE = 2
/** Mean sim seconds between Pre-seed incidents. The design's 12 minutes is too slow for a playtest. */
export const INCIDENT_GAP = 200
/** Sim seconds from the Pre-seed raise to the first incident. */
export const FIRST_INCIDENT_AFTER = 90
