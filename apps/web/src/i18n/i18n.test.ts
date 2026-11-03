import { describe, expect, test } from 'vitest'
import { Option, Schema } from 'effect'
import { Scene } from 'foldkit/test'
import { Listbox } from '@foldkit/ui'
import { glossaryPanel } from '../components/lab/glossary.ts'
import { inertHtml, type Html } from 'foldkit/html'
import { Prefs } from '../game/model.ts'
import { Message } from '../game/message.ts'
import { initialModel, update } from '../game/update.ts'
import { AppRoute } from '../game/route.ts'
import { localizeHtml, translate } from './index.ts'

describe('interface languages', () => {
  test('old preferences still decode without losing sound or motion', () => {
    const prefs = Schema.decodeSync(Prefs)({ muted: true, motion: 'reduce' })
    expect(prefs).toMatchObject({ locale: 'en', muted: true, motion: 'reduce' })
  })

  test('a language change persists, applies and synchronizes a paused board without changing the game', () => {
    const model = { ...initialModel(), route: AppRoute.Company(), paused: true }
    const result = update(model, Message.LocaleChosen({ locale: 'zh-CN' }))
    expect(result.model.locale).toBe('zh-CN')
    expect(result.model.game).toBe(model.game)
    expect(result.model.paused).toBe(true)
    expect(result.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'WritePrefs',
          args: expect.objectContaining({ prefs: expect.objectContaining({ locale: 'zh-CN' }) }),
        }),
        expect.objectContaining({
          name: 'ApplySettings',
          args: expect.objectContaining({ locale: 'zh-CN' }),
        }),
        expect.objectContaining({
          name: 'SyncBoard',
          args: expect.objectContaining({ locale: 'zh-CN' }),
        }),
      ]),
    )
    const restored = update(
      initialModel(),
      Message.PrefsLoaded({
        json: JSON.stringify({ locale: 'zh-CN', muted: true, motion: 'reduce' }),
      }),
    )
    expect(restored.model).toMatchObject({ locale: 'zh-CN', muted: true, motion: 'reduce' })
    expect(update(result.model, Message.LocaleChosen({ locale: 'en' })).model.game).toBe(model.game)
  })

  test('language and existing preferences survive company, sandbox and challenge entry', () => {
    const model = {
      ...initialModel(),
      locale: 'zh-CN' as const,
      muted: true,
      motion: 'reduce' as const,
    }
    for (const message of [
      Message.NewCompanyStarted(),
      Message.PreseedStarted(),
      Message.FreeSandboxStarted(),
      Message.ChallengeStarted({ id: 'hello-world' }),
    ]) {
      expect(update(model, message).model).toMatchObject({
        locale: 'zh-CN',
        muted: true,
        motion: 'reduce',
      })
    }
  })

  test('listbox selection closes, restores focus and uses the persisted locale path', () => {
    const model = { ...initialModel(), route: AppRoute.Company(), paused: true }
    const opened = update(
      model,
      Message.LanguagePickerChanged({
        message: Listbox.Message.Opened({ maybeActiveItemIndex: Option.some(0) }),
      }),
    )
    expect(opened.model.languagePicker.isOpen).toBe(true)
    const selected = update(
      opened.model,
      Message.LanguagePickerChanged({
        message: Listbox.Message.SelectedItem({ item: 'zh-CN' }),
      }),
    )
    expect(selected.model.languagePicker.isOpen).toBe(false)
    expect(selected.model.locale).toBe('zh-CN')
    expect(selected.model.game).toBe(model.game)
    expect(selected.model.paused).toBe(true)
    expect(selected.commands?.map((command) => command.name)).toEqual(
      expect.arrayContaining(['FocusButton', 'WritePrefs', 'ApplySettings', 'SyncBoard']),
    )
    const closed = update(
      opened.model,
      Message.LanguagePickerChanged({ message: Listbox.Message.Closed() }),
    )
    expect(closed.model.locale).toBe('en')
    expect(closed.model.languagePicker.isOpen).toBe(false)
    expect(closed.commands?.map((command) => command.name)).not.toContain('WritePrefs')
  })

  test('upstream glossary categories still constrain Chinese search results', () => {
    const model = { ...initialModel(), locale: 'zh-CN' as const, glossaryQuery: '背压' }
    Scene.scene(
      { update, view: glossaryPanel },
      Scene.given(model),
      Scene.expect(Scene.text('Backpressure')).toExist(),
    )
    Scene.scene(
      { update, view: glossaryPanel },
      Scene.given({ ...model, glossaryCategory: 'security' }),
      Scene.expect(Scene.text('No matches')).toExist(),
    )
  })

  test('complete messages interpolate values and preserve technical names and unknown prose', () => {
    expect(translate('zh-CN', 'Server · cold')).toBe('服务器 · 冷启动')
    expect(translate('zh-CN', 'Collect  $12.30')).toBe('收款  $12.30')
    expect(translate('zh-CN', '1.2k users')).toBe('1.2k 位用户')
    expect(translate('zh-CN', 'PostgreSQL')).toBe('PostgreSQL')
    expect(translate('zh-CN', 'constructor')).toBe('constructor')
    expect(translate('zh-CN', 'Unknown message with Server in it')).toBe(
      'Unknown message with Server in it',
    )
    expect(translate('en', 'Server · cold')).toBe('Server · cold')
  })

  test('localization preserves identity, attributes, handlers and input values without mutating the source', () => {
    const h = inertHtml
    const original = h.div(
      [h.Key('Research'), h.Title('Research'), h.DataAttribute('name', 'Research')],
      [
        h.span([], ['Research']),
        h.input([h.Value('Research'), h.Placeholder('Search…'), h.AriaLabel('Search')]),
        h.a([h.Href('/Research')], ['Continue']),
      ],
    )!
    const callback = () => {}
    original.data = { ...original.data, on: { click: callback } }
    const result = localizeHtml('zh-CN', original)!
    expect(result.key).toBe(original.key)
    expect(result.data?.on?.click).toBe(callback)
    expect(result.data?.props?.title).toBe('研究')
    expect(result.data?.dataset).toEqual(original.data.dataset)
    expect(original.data.props?.title).toBe('Research')
    expect(JSON.stringify(result)).toContain('研究')
    expect(JSON.stringify(result)).toContain('搜索…')
    expect(JSON.stringify(result)).toContain('/Research')
    expect(JSON.stringify(result)).toContain('"value":"Research"')
    const english = localizeHtml('en', original)!
    expect(english.data?.props?.title).toBe('Research')
    expect(english.data?.on?.click).toBe(callback)
    // Vitest runs Foldkit's real view-branding transform. Switching languages
    // must preserve the identities of every ancestor of the mounted canvas.
    const identities = (node: Html): unknown =>
      node && [
        node.identity,
        node.children?.map((child) => (typeof child === 'string' ? null : identities(child))),
      ]
    expect(identities(english)).toEqual(identities(result))
  })
})
