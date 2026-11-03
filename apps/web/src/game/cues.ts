import { canRaise } from '@quorum/simulation/actions'
import { senderOf } from './mail.ts'
import type { Message } from './message.ts'
import { placingOf, type Model, type Tone } from './model.ts'
import { onBoard } from './route.ts'
import type { Sound } from './sound.ts'

/* ==========================================================================
   Sound cues: what the player hears after each Message. One cue per update,
   chosen from what changed, so a gesture sounds the same from the pointer and
   from the keyboard. Warnings and errors win over everything else, and a
   refused action never plays its success sound.
   ========================================================================== */

export type Cue = Readonly<{ sound: Sound; pitch: number; spatial: boolean }>

const TONE_SOUND: Record<Tone, Sound> = {
  plain: 'notify',
  primary: 'notify',
  ok: 'success',
  warn: 'warn',
  danger: 'error',
}

/** Speeds step up a fifth at a time, so the faster clock sounds higher. */
const SPEED_PITCH: Record<number, number> = { 1: 1, 2: 1.5, 4: 2.25 }

/** A purchase at or above this much Cash is celebrated (sound, burst, and a line of praise). */
export const BIG_PURCHASE = 1_000

const gesture = (sound: Sound, pitch = 1): Cue => ({ sound, pitch, spatial: true })
const event = (sound: Sound): Cue => ({ sound, pitch: 1, spatial: false })

/** The cue for a gesture that succeeded, from the Message and what it changed. */
const gestureCue = (before: Model, message: Message, after: Model): Cue | null => {
  const game = before.game
  const next = after.game
  switch (message._tag) {
    case 'PanelOpened':
      if (after.panel === before.panel) return null
      if (after.panel === 'none') return gesture('close')
      return before.panel === 'none' ? gesture('open') : gesture('switch')
    case 'PanelClosed':
    case 'TitleOpened':
    case 'RoundDeclined':
      return gesture('close')
    case 'BuildGroupChosen':
      if (after.buildGroup === null) return gesture('close')
      return before.buildGroup === null ? gesture('open') : gesture('switch')
    case 'PlacingChosen':
      return placingOf(after) ? gesture('pick') : gesture('close')
    case 'NodePlaced':
      return next.nodes.length > game.nodes.length ? gesture('place') : null
    case 'NodeTapped':
      return after.selected !== before.selected ? gesture('tick') : null
    case 'EmptyTapped':
      return after.selected !== before.selected ? gesture('tick', 0.8) : null
    case 'NodeMoved':
      return gesture('drop')
    case 'LinkRequested':
      return next.links.length > game.links.length ? gesture('connect') : null
    case 'LinkCut':
      return gesture('cut')
    case 'NodeSold':
    case 'SellConfirmed':
      return gesture('remove')
    case 'ResizeChosen':
      if (message.direction < 0) return gesture('downgrade')
      // A big purchase gets the celebration; a small one keeps the quick motor-and-beeps.
      return game.cash - next.cash >= BIG_PURCHASE ? event('purchase') : gesture('upgrade')
    case 'FamilyChosen':
    case 'RuntimeChosen':
    case 'FrameworkChosen':
    case 'WorkersChosen':
    case 'SampleChosen':
    case 'MixChosen':
    case 'FullscreenToggled':
      return gesture('toggle')
    case 'DemandStepped':
      return gesture('tick', message.direction > 0 ? 1.25 : 0.8)
    case 'ReplaceBought':
    case 'RestartChosen':
      return gesture('reboot')
    case 'IndexAdded':
      return gesture('success')
    case 'Collected':
    case 'CheatCash':
    case 'CheatInsight':
      return gesture('coin')
    case 'UndoChosen':
      return next !== game ? gesture('undo') : null
    case 'ResearchFocused':
      return after.researchFocus !== before.researchFocus ? gesture('tick') : null
    case 'ResearchBought':
      return gesture('unlock')
    case 'RoundRaised':
      return gesture('fanfare')
    case 'PostmortemFiled':
      return message.take ? gesture('unlock') : gesture('close')
    case 'PauseToggled':
      return gesture('toggle', after.paused ? 0.8 : 1.15)
    case 'SpeedCycled':
    case 'SpeedChosen':
      return gesture('tick', SPEED_PITCH[after.speed] ?? 1)
    case 'KeyPressed':
      // Other keys route to the Message they stand for, which plays its own cue.
      return message.key === 'Escape' &&
        (placingOf(after) !== placingOf(before) ||
          after.buildGroup !== before.buildGroup ||
          after.panel !== before.panel)
        ? gesture('close')
        : null
    case 'BoardFitted':
    case 'BoardTidied':
    case 'FreeSandboxReset':
    case 'StressBoardLoaded':
    case 'CompanyCopied':
      return gesture('switch')
    default:
      return null
  }
}

/** The cue for what the clock brought: a passed Sandbox, a round to raise, a settled change. */
const tickCue = (before: Model, after: Model): Cue | null => {
  if (after.panel === 'passed' && before.panel !== 'passed') return event('fanfare')
  if (!before.sandbox && canRaise(after.game) && !canRaise(before.game)) return event('ready')
  // Mail that wants attention: a provider, an alarm, or an advisory. It is new when this tick
  // added it or a line to it; the clock cannot tell, because a reset winds it back under old Mail.
  const urgent = after.inbox.mail.some(
    (mail) =>
      mail.time > (before.inbox.mail.find((old) => old.id === mail.id)?.time ?? -Infinity) &&
      !mail.read &&
      !mail.spam &&
      ['cloud', 'monitoring', 'security'].includes(senderOf(mail.sender).kind),
  )
  if (urgent) return event('warn')
  if (after.delta && after.delta.id !== before.delta?.id)
    return after.delta.worse ? event('warn') : event('settle')
  return null
}

/** What the player hears after `message` took the Model from `before` to `after`. */
export const cueOf = (before: Model, message: Message, after: Model): Cue | null => {
  // The title screen plays its own menu sounds.
  if (!onBoard(before.route)) return null
  const raised = after.toast && after.toast.id !== before.toast?.id ? after.toast : null
  if (raised && (raised.tone === 'warn' || raised.tone === 'danger'))
    return { sound: TONE_SOUND[raised.tone], pitch: 1, spatial: message._tag !== 'Ticked' }
  const cue =
    message._tag === 'Ticked' ? tickCue(before, after) : gestureCue(before, message, after)
  if (cue) return cue
  return raised ? event(TONE_SOUND[raised.tone]) : null
}
