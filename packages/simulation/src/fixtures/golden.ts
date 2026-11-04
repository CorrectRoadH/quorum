import { preseedGame } from '../company.ts'
import type { Game } from '../state.ts'
import { step } from '../step.ts'

/** Sim seconds in one golden Step. */
export const GOLDEN_STEP = 0.25

/** The golden Company: the Pre-seed start with seed 1, so incidents fire and roll. */
export const goldenGame = (): Game => preseedGame(1)

/** Runs a Game for `steps` golden Steps with no player actions. */
export const replay = (game: Game, steps: number): Game => {
  let current = game
  for (let index = 0; index < steps; index += 1) current = step(current, GOLDEN_STEP).game
  return current
}

export const GOLDEN_STEPS = 10_000
// SIM_VERSION 2 (M4): the founder now builds Features with Dev Hours and each
// deploy rolls for a bad deploy, so the Pre-seed replay's demand and seed move.
// SIM_VERSION 3 (M5 Seed): the save gains Queue depth, Cache, Queue and WAF
// options, and stored GB. The Pre-seed replay's values are unchanged; the
// encoded Game carries the new fields, so its hash moves.
// SIM_VERSION 4 (M5 Series A): the save gains each Node's zone, standby, copies
// and Autoscaler settings, the incident's zone, and the error budget. The
// Pre-seed replay's values are unchanged; the encoded Game carries the new
// fields, so its hash moves.
// SIM_VERSION 5 (M5 Series B): the save gains each Node's GPU type, collector,
// GOGC, load shedding and read-your-writes, and each Link's breaker, open time
// and failure share. The Pre-seed replay's values are unchanged; the encoded
// Game carries the new fields, so its hash moves.
// SIM_VERSION 6 (M6): the save gains each Node's region, quorum settings, lost
// replica, spread, backups, fan-out and key splitting, the incident's region,
// users in each SLO hour, the DR drill and the Public quarter. The replay's values
// are unchanged again; only the new fields move the hash.
// SIM_VERSION 7 (M7): the save gains the founding (Venture, Mutators, perks),
// banked Legacy, peak users, and the wall clock of the last save. The replay's
// values are unchanged: with the new fields removed it still hashes to aed6bacd.
// SIM_VERSION 8: one Dev Hour is one engineer-hour, made 8 per calendar day on
// the Team's calendar, and Features have real sizes and requirements, so the
// founder's backlog builds at a new pace.
// SIM_VERSION 9: prices follow real list prices, requests earn half as much, and
// the cost and salary index rise from Seed (16 "Cost index").
// SIM_VERSION 10: Insight has a pool per request kind and a Failure pool, grows
// with the square root of samples per Component type, and research runs as
// Studies that take Insight over time; sampling adds CPU and latency.
// SIM_VERSION 11: a CVE is disclosed every few minutes as a patch ticket with a
// deadline; an overdue one is exploited and starts a Data breach. The save gains
// the disclosed CVEs, and a backlog item gains its deadline.
// SIM_VERSION 12: Split the Box asks for p99 under 300 ms, and the daily drill's
// boards serve their users until the incident. The Company replay is unchanged.
// SIM_VERSION 13: all 32 Challenges. A Challenge board can set its request mix,
// what each kind earns, regional daily cycles, and fixes paid in Dev Hours; a run
// takes incident responses, and a coarse Step runs second by second while
// something fails. A Tomcat box holding realtime connections refuses work at its
// RAM instead of swapping, and a store spread across regions survives a zone.
// The Company replay is unchanged.
// SIM_VERSION 14: async work is scored on when it finishes, a Queue has a max
// length and max attempts, a Worker prefetches, and a backlog is offered only as
// fast as Workers take it. The save gains each Node's attempts, max length and
// prefetch.
export const GOLDEN_HASH = '145fc751'

/**
 * The hash of the Game each Challenge's reference solution ends on
 * (`fixtures/challenges.ts`). Node, the browsers and workerd must agree.
 */
export const REFERENCE_HASHES: Readonly<Record<string, string>> = {
  'hello-world': 'db205ddb',
  'split-the-box': 'bedbfcdc',
  slashdotted: '681b033e',
  c10k: '2ccf16c0',
  'event-loop': '8e64ddd1',
  'too-many-connections': 'de2bb199',
  shoestring: 'dcb1d8c9',
  'n-plus-one': '18c7488b',
  'thirteen-engineers': 'ec3e75bb',
  'credential-stuffing': '98a4f62a',
  'black-friday': 'ca0cb4c9',
  'us-east-1': '5c823c48',
  'exactly-once': '9709b829',
  'two-million-sockets': '29b1c4f8',
  'pokemon-go': '9d9997cd',
  'healthcare-launch': 'ef24823c',
  'thundering-herd': 'c42a83eb',
  'read-states': '8138dfd5',
  'fail-whale': '4a3dd18f',
  'reports-at-noon': 'd89573b5',
  'gpu-economics': '458de30b',
  metastable: '218870b5',
  'regex-of-doom': '9c3c0bb3',
  'forty-three-seconds': '1bd130ba',
  'follow-the-sun': '3b35e597',
  celebrity: '9c876d5a',
  'gone-from-the-internet': 'd08554f8',
  'the-typo': '41263066',
  'leap-second': 'be9126f5',
  'rule-of-40': 'bcd2764d',
  'postgres-for-everything': '4bb732e5',
  'five-nines': 'd1e74acc',
}
