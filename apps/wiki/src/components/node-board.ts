import { HOME_REGION, type ComponentId } from '@quorum/simulation/catalog'
import { blankNode } from '@quorum/simulation/actions'
import { freeSandbox } from '@quorum/simulation/sandbox'
import { solveFlow } from '@quorum/simulation/solve'
import { attachBoard, setBoard, type BoardState } from '@quorum/ui/board/board'

/* ==========================================================================
   One Component's Node card, drawn by the game's own board (Pixi). The Node
   is solved on the free Sandbox's Design, so its rows read as in the game;
   only the Node itself is drawn. Loaded on demand from node-card.ts.
   ========================================================================== */

const NOOP = () => {}

export const drawNodeCard = (key: string, type: ComponentId, host: HTMLElement): (() => void) => {
  const base = freeSandbox()
  const existing = base.nodes.find((node) => node.type === type)
  const node = existing ?? blankNode(base, `sample-${type}`, type, 1080, 280)
  const full = existing ? base : { ...base, nodes: [...base.nodes, node] }
  const ledger = solveFlow(full)
  const state: BoardState = {
    locale: 'en',
    translate: (text) => text,
    game: { ...full, nodes: [node], links: [] },
    ledger: { ...ledger, bottleneck: null },
    selected: null,
    selection: [],
    placing: null,
    stamp: null,
    history: {},
    region: HOME_REGION,
    paused: true,
    suspended: false,
    cue: null,
    readOnly: true,
    inset: { top: 24, bottom: 16, left: 0 },
  }
  setBoard(key, state)
  const detach = attachBoard(key, host, {
    onNodeTap: NOOP,
    onNodeMove: NOOP,
    onFooter: NOOP,
    onLink: NOOP,
    onUnlink: NOOP,
    onPlace: NOOP,
    onEmptyTap: NOOP,
    onNodeToggle: NOOP,
    onBox: NOOP,
  })
  // The board draws cards on a new state, and it starts asynchronously; send the state again
  // over its first second so a draw lands once it has started.
  let frames = 0
  let frame = requestAnimationFrame(function again() {
    setBoard(key, state)
    frames += 1
    if (frames < 60) frame = requestAnimationFrame(again)
  })
  return () => {
    cancelAnimationFrame(frame)
    detach()
  }
}
