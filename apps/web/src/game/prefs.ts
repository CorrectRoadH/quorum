import type { Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { Locale } from '../i18n/index.ts'
import type { Prefs } from './model.ts'

/* The Settings panel's toggles, folded into the parent with foldChild. The parent saves and applies the result. */

export const PrefsMessage = defineMessageUnion({
  LocaleChosen: { locale: Locale },
  MuteToggled: {},
  AutoPauseToggled: {},
  BlurPauseToggled: {},
  AgentAccessToggled: {},
  MotionToggled: {},
})
export type PrefsMessage = typeof PrefsMessage.Type

export const updatePrefs = (
  prefs: Prefs,
  message: PrefsMessage,
): Update.Return<Prefs, PrefsMessage> =>
  PrefsMessage.match<Update.Return<Prefs, PrefsMessage>>(message, {
    LocaleChosen: ({ locale }) => ({ model: { ...prefs, locale } }),
    MuteToggled: () => ({ model: { ...prefs, muted: !prefs.muted } }),
    AutoPauseToggled: () => ({ model: { ...prefs, autoPause: !prefs.autoPause } }),
    BlurPauseToggled: () => ({ model: { ...prefs, blurPause: !prefs.blurPause } }),
    AgentAccessToggled: () => ({ model: { ...prefs, agentAccess: !prefs.agentAccess } }),
    MotionToggled: () => ({
      model: { ...prefs, motion: prefs.motion === 'reduce' ? 'system' : 'reduce' },
    }),
  })
