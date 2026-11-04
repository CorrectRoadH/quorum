import type { Html, HtmlBuilder } from 'foldkit/html'

import { cn } from 'cn'

type Child = Html | string

// InputOtp renders one transparent <input> overlaid across a row of visual
// slots. Every keystroke lands in that single input, so the browser handles
// the hard parts natively — auto-advancing as digits are typed, stepping back
// on Backspace, arrow-key navigation, and pasting a full code into the slots —
// the way shadcn's `input-otp` base surface does through the `input-otp`
// library. The slots are purely presentational: each shows one character of
// `value`, and the next-to-fill slot shows a blinking caret.
//
// The dependency-free helpers below (`normalizeOtpValue`,
// `isCompleteOtpValue`, `otpSlotStates`) are the headless core: they own
// every domain rule with no foldkit import, so they can move verbatim into a
// future `@foldkit/ui` OTP primitive while this file keeps the styled parts.

/** Which characters a code may contain. `digits` mirrors the numeric-OTP
 *  demos; `alphanumeric` serves codes like a four-letter room key, and
 *  uppercases whatever the player types. */
export type OtpAlphabet = 'digits' | 'alphanumeric'

const KEEP: Record<OtpAlphabet, RegExp> = {
  digits: /[^0-9]/g,
  alphanumeric: /[^0-9A-Z]/g,
}

/** Value capped at `length`, stripped to the allowed alphabet. Mirrors the
 *  numeric-OTP demos: every keystroke, paste, or autofill is reduced to this
 *  before it reaches slots or callbacks. */
export const normalizeOtpValue = (
  raw: string,
  length: number,
  alphabet: OtpAlphabet = 'digits',
): string => {
  const cased = alphabet === 'digits' ? raw : raw.toUpperCase()
  return cased.replace(KEEP[alphabet], '').slice(0, length)
}

/** A normalized value fills every slot. Owners derive completion from their
 *  stored value with this instead of a second callback. */
export const isCompleteOtpValue = (
  value: string,
  length: number,
  alphabet: OtpAlphabet = 'digits',
): boolean => normalizeOtpValue(value, length, alphabet).length >= length

/** Per-slot render state, always `length` long. Exactly one slot is active
 *  (the insert position) until the code is complete, when none is — the same
 *  rule the `input-otp` library's `hasFakeCaret` follows. */
export type OtpSlotState = Readonly<{
  index: number
  char: string | null
  isActive: boolean
}>

export const otpSlotStates = (
  value: string,
  length: number,
  alphabet: OtpAlphabet = 'digits',
): ReadonlyArray<OtpSlotState> => {
  const digits = normalizeOtpValue(value, length, alphabet).split('')
  const activeIndex = digits.length >= length ? -1 : digits.length
  return Array.from({ length }, (_, index) => ({
    index,
    char: digits[index] ?? null,
    isActive: index === activeIndex,
  }))
}

export const inputOtpClass = 'gap-2 relative flex items-center has-disabled:opacity-50'

/** Wrapper grouping the joined slots. Upstream keys the group's invalid ring
 *  off descendant `aria-invalid` (`has-aria-invalid:`), which the default
 *  layout threads onto every slot via `isInvalid`; custom `children`
 *  layouts must pass `isInvalid` to their own slots for the ring to light. */
export const inputOtpGroupClass =
  'has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive rounded-lg has-aria-invalid:ring-3 flex items-center gap-1.5'

export const inputOtpInputClass =
  'absolute inset-0 z-10 h-full w-full bg-transparent text-transparent caret-transparent outline-none disabled:cursor-not-allowed'

export const inputOtpSlotClass =
  'bg-well shadow-well border-transparent data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive size-9 rounded-lg border font-mono text-sm transition-all outline-none data-[active=true]:ring-3 relative flex items-center justify-center data-[active=true]:z-10'

export const inputOtpCaretClass =
  'pointer-events-none absolute inset-0 flex items-center justify-center'

export const inputOtpCaretLineClass = 'animate-caret-blink bg-foreground h-4 w-px duration-1000'

export const inputOtpSeparatorClass = "[&_svg:not([class*='size-'])]:size-4 flex items-center"

export type InputOtpConfig<M> = Readonly<{
  length: number
  value: string
  onInput?: (value: string) => M
  onComplete?: (value: string) => M
  isDisabled?: boolean
  isInvalid?: boolean
  autoFocus?: boolean
  alphabet?: OtpAlphabet
  id?: string
  className?: string
  children?: ReadonlyArray<Child>
}>

/** Visual separator between OTP groups (e.g. between groups of 3). Upstream
 *  renders a `Minus` icon; foldcn uses a text fallback to avoid extra icon
 *  deps. Carries `data-slot="input-otp-separator"` and `role="separator"` to
 *  match upstream. */
export const inputOtpSeparator = <M>(
  config: Readonly<{ className?: string }>,
  h: HtmlBuilder<M>,
): Html =>
  h.div(
    [
      h.DataAttribute('slot', 'input-otp-separator'),
      h.Role('separator'),
      h.Class(cn(inputOtpSeparatorClass, config.className)),
    ],
    ['−'],
  )

/** One visual slot. The parent owns the code string and passes it down with
 *  the slot's `index` — the same information upstream's `OTPInputContext`
 *  carries, without framework context. */
export type InputOtpSlotConfig = Readonly<{
  index: number
  value: string
  length: number
  isInvalid?: boolean
  alphabet?: OtpAlphabet
  className?: string
}>

export const inputOtpSlot = <M>(config: InputOtpSlotConfig, h: HtmlBuilder<M>): Html => {
  const state = otpSlotStates(config.value, config.length, config.alphabet ?? 'digits')[
    config.index
  ] ?? {
    ...(config.index === undefined ? {} : { index: config.index }),
    char: null,
    isActive: false,
  }
  return h.div(
    [
      h.Class(cn(inputOtpSlotClass, config.className)),
      h.DataAttribute('slot', 'input-otp-slot'),
      h.DataAttribute('active', state.isActive ? 'true' : 'false'),
      ...(config.isInvalid === true ? [h.AriaInvalid(true)] : []),
    ],
    [
      state.char ?? '',
      state.isActive
        ? h.div([h.Class(inputOtpCaretClass)], [h.div([h.Class(inputOtpCaretLineClass)], [])])
        : null,
    ],
  )
}

/** A row of joined slots. Pass slots (and separators between groups) as
 *  children to compose multi-group layouts like upstream's separator demo. */
export const inputOtpGroup = <M>(
  config: Readonly<{ className?: string }>,
  children: ReadonlyArray<Child>,
  h: HtmlBuilder<M>,
): Html =>
  h.div(
    [h.Class(cn(inputOtpGroupClass, config.className)), h.DataAttribute('slot', 'input-otp-group')],
    children,
  )

/** A row of single-character OTP slots backed by one combined string `value`.
 *  Digit-only filtering is intentional (mirrors upstream numeric OTP):
 *  non-digits are stripped on display and on input.
 *
 *  `onInput` is the update channel and fires on every change, including the
 *  completing one (mirrors upstream `onChange`). With no `onInput`,
 *  `onComplete` doubles as the update channel and fires on every change —
 *  check `isCompleteOtpValue(next, length)` before treating it as
 *  completion. Controlled owners observe completion from their stored value;
 *  foldkit maps one event to one message, so the two callbacks never fire
 *  for the same keystroke.
 *
 *  Pass `children` (groups interleaved with separators) for multi-group
 *  layouts; omit it for the default single group of `length` slots. */
export const inputOtp = <M>(config: InputOtpConfig<M>, h: HtmlBuilder<M>): Html => {
  const alphabet = config.alphabet ?? 'digits'
  const value = normalizeOtpValue(config.value, config.length, alphabet)

  return h.div(
    [h.Class(cn(inputOtpClass, config.className)), h.DataAttribute('slot', 'input-otp')],
    [
      h.input([
        h.Type('text'),
        h.InputMode(alphabet === 'digits' ? 'numeric' : 'text'),
        h.Attribute('autocomplete', 'one-time-code'),
        // No native maxlength: pasting a spaced/dashed code must reach the
        // handler whole so `normalizeOtpValue` strips separators before
        // capping at `length`. Over-length typing collapses back to the
        // normalized value on re-render.
        h.Spellcheck(false),
        ...(config.isDisabled === true ? [h.Disabled(true)] : []),
        ...(config.isInvalid === true ? [h.AriaInvalid(true)] : []),
        ...(config.autoFocus === true ? [h.Autofocus(true)] : []),
        ...(config.id === undefined ? [] : [h.Id(config.id)]),
        h.Value(value),
        h.Class(inputOtpInputClass),
        h.DataAttribute('slot', 'input-otp-input'),
        ...(config.onInput === undefined && config.onComplete === undefined
          ? []
          : [
              h.OnInput((raw) => {
                const next = normalizeOtpValue(raw, config.length, alphabet)
                if (config.onInput !== undefined) {
                  return config.onInput(next)
                }
                if (config.onComplete !== undefined) {
                  return config.onComplete(next)
                }
                throw new Error('unreachable: OnInput is only attached with a callback')
              }),
            ]),
      ]),
      ...(config.children === undefined
        ? [
            inputOtpGroup<M>(
              {},
              Array.from({ length: config.length }, (_, index) =>
                inputOtpSlot(
                  {
                    index,
                    value,
                    length: config.length,
                    alphabet,
                    ...(config.isInvalid === undefined ? {} : { isInvalid: config.isInvalid }),
                  },
                  h,
                ),
              ),
              h,
            ),
          ]
        : config.children),
    ],
  )
}
