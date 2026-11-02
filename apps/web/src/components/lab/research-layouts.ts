import {
  ERAS,
  RESEARCH,
  RESEARCH_TRACKS,
  researchList,
  type ResearchDef,
  type ResearchId,
  type ResearchTrack,
} from '@quorum/simulation/catalog'

/* ==========================================================================
   The Research tree's layout: a tree per track, growing up from a root
   through one band per Era. Each track's root holds up the items with no
   prerequisite in their own track, so none of them float loose. The layout
   comes from the catalog alone, so it is computed once.
   ========================================================================== */

export const NODE_SIZE = { w: 184, h: 48 }

export type Placed = Readonly<{ entry: ResearchDef; x: number; y: number }>

/** A line behind the nodes. `from` decides whether it is drawn as done. */
export type Wire = Readonly<{
  key: string
  d: string
  from: ResearchId | null
  /** Null for a trunk, which no one item owns. */
  to: ResearchId | null
  /** A line from a track root, not a prerequisite. */
  root: boolean
}>

export type EraBand = Readonly<{ era: number; x: number; y: number; w: number; h: number }>

/** A track's root, at the foot of its trunk. */
export type TrackMark = Readonly<{ track: ResearchTrack; label: string; x: number; y: number }>

export type Layout = Readonly<{
  width: number
  height: number
  placed: ReadonlyMap<ResearchId, Placed>
  wires: ReadonlyArray<Wire>
  bands: ReadonlyArray<EraBand>
  tracks: ReadonlyArray<TrackMark>
}>

const ERA_LIST = [...new Set(researchList.map((entry) => entry.era))].toSorted((a, b) => a - b)
const TRACKS = RESEARCH_TRACKS.filter((track) =>
  researchList.some((entry) => entry.track === track.key),
)

const cellOf = (track: ResearchTrack, era: number) =>
  researchList.filter((entry) => entry.track === track && entry.era === era)

/** Items with no prerequisite in their own track: the ones a track root holds up. */
const isRoot = (entry: ResearchDef): boolean =>
  !entry.requires.some((id) => RESEARCH[id].track === entry.track)

const curve = (ax: number, ay: number, bx: number, by: number, vertical: boolean): string => {
  if (vertical) {
    const bend = Math.max(8, Math.abs(by - ay) / 2) * Math.sign(by - ay || 1)
    return `M${ax} ${ay} C${ax} ${ay + bend} ${bx} ${by - bend} ${bx} ${by}`
  }
  const bend = Math.max(8, Math.abs(bx - ax) / 2) * Math.sign(bx - ax || 1)
  return `M${ax} ${ay} C${ax + bend} ${ay} ${bx - bend} ${by} ${bx} ${by}`
}

const build = (): Layout => {
  const { w, h } = NODE_SIZE
  const GAP_X = 16
  const GAP_Y = 34
  const PAD = 36
  const SLOTS = 2
  const COLUMN = SLOTS * w + GAP_X + PAD * 2
  const ROOT_H = 150
  const BAND_PAD = 28
  const LEFT = 120
  // Rows per Era band: as many as its fullest track needs, at most two items a row.
  const rowsOf = (track: ResearchTrack, era: number): Array<Array<ResearchDef>> => {
    const cell = cellOf(track, era)
    const inCell = new Set(cell.map((entry) => entry.id))
    const rows: Array<Array<ResearchDef>> = []
    const rowOf = new Map<ResearchId, number>()
    // Parents first, so an in-cell follow-up always sits a row above.
    const order = cell.toSorted(
      (a, b) =>
        a.requires.filter((id) => inCell.has(id)).length -
        b.requires.filter((id) => inCell.has(id)).length,
    )
    for (const entry of order) {
      const floor = Math.max(
        0,
        ...entry.requires.filter((id) => inCell.has(id)).map((id) => (rowOf.get(id) ?? -1) + 1),
      )
      let line = floor
      while ((rows[line]?.length ?? 0) >= SLOTS) line++
      ;(rows[line] ??= []).push(entry)
      rowOf.set(entry.id, line)
    }
    return rows.filter((row) => row.length > 0)
  }
  const bandRows = ERA_LIST.map((era) =>
    Math.max(1, ...TRACKS.map((track) => rowsOf(track.key, era).length)),
  )
  const bandH = bandRows.map((rows) => BAND_PAD * 2 + rows * h + (rows - 1) * GAP_Y)
  const height = ROOT_H + bandH.reduce((sum, item) => sum + item, 0)
  // Garage is the lowest band; each later Era sits above the one before.
  const bandTop = ERA_LIST.map(
    (_, index) => height - ROOT_H - bandH.slice(0, index + 1).reduce((sum, item) => sum + item, 0),
  )
  const placed = new Map<ResearchId, Placed>()
  const tracks: Array<TrackMark> = []
  const wires: Array<Wire> = []
  TRACKS.forEach((track, column) => {
    const left = LEFT + column * COLUMN + PAD
    const middle = left + w + GAP_X / 2
    ERA_LIST.forEach((era, index) => {
      const bottom = bandTop[index]! + bandH[index]! - BAND_PAD
      rowsOf(track.key, era).forEach((row, line) => {
        // A lone item sits on the trunk's side nearest its parent.
        const ordered = row.toSorted((a, b) => parentX(a) - parentX(b))
        ordered.forEach((entry, slot) => {
          const lone = row.length === 1
          const x = lone
            ? parentX(entry) > middle
              ? left + w + GAP_X
              : left
            : left + slot * (w + GAP_X)
          placed.set(entry.id, { entry, x, y: bottom - h - line * (h + GAP_Y) })
        })
      })
    })
    tracks.push({ track: track.key, label: track.label, x: middle, y: height - ROOT_H / 2 })
    // The trunk runs up the gap between the two slots; each root item branches off it.
    const roots = researchList.filter((entry) => entry.track === track.key && isRoot(entry))
    const forks = roots.flatMap((entry) => {
      const place = placed.get(entry.id)
      return place
        ? [{ entry, bx: place.x + w / 2, by: place.y + h, fork: place.y + h + GAP_Y / 2 }]
        : []
    })
    const base = height - ROOT_H / 2 - 28
    const peak = Math.min(...forks.map((item) => item.fork))
    wires.push({
      key: `trunk-${track.key}`,
      d: `M${middle} ${base} L${middle} ${peak}`,
      from: null,
      to: null,
      root: true,
    })
    // Each root item branches off the trunk at the gap below it.
    for (const { entry, bx, by, fork } of forks) {
      const side = Math.sign(bx - middle)
      const d = `M${middle} ${fork} L${bx - side * 6} ${fork} Q${bx} ${fork} ${bx} ${fork - 6} L${bx} ${by}`
      wires.push({ key: `root-${entry.id}`, d, from: null, to: entry.id, root: true })
    }
  })
  function parentX(entry: ResearchDef): number {
    const ids = entry.requires.filter((id) => placed.has(id))
    if (ids.length === 0) return 0
    return ids.reduce((sum, id) => sum + placed.get(id)!.x, 0) / ids.length + w / 2
  }
  for (const entry of researchList)
    for (const id of entry.requires) {
      const a = placed.get(id)
      const b = placed.get(entry.id)
      if (!a || !b) continue
      const up = b.y + h <= a.y
      const d = up
        ? curve(a.x + w / 2, a.y, b.x + w / 2, b.y + h, true)
        : b.x >= a.x + w
          ? curve(a.x + w, a.y + h / 2, b.x, b.y + h / 2, false)
          : curve(a.x, a.y + h / 2, b.x + w, b.y + h / 2, false)
      wires.push({ key: `${id}>${entry.id}`, d, from: id, to: entry.id, root: false })
    }
  return {
    width: LEFT + TRACKS.length * COLUMN,
    height,
    placed,
    wires,
    bands: ERA_LIST.map((era, index) => ({
      era,
      x: 0,
      y: bandTop[index]!,
      w: LEFT + TRACKS.length * COLUMN,
      h: bandH[index]!,
    })),
    tracks,
  }
}

let cached: Layout | null = null
export const researchLayout = (): Layout => (cached ??= build())

export const eraName = (era: number): string => ERAS[era]?.name ?? ''
