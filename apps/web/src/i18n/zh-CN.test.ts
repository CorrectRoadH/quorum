import { describe, expect, test } from 'vitest'
import { Scene } from 'foldkit/test'
import { GLOSSARY } from '@quorum/simulation/catalog'
import { inboxPanel, peek } from '../components/lab/inbox.ts'
import { glossaryPanel } from '../components/lab/glossary.ts'
import { ADVICE } from '../game/copy/index.ts'
import { EMPTY_INBOX, mailed } from '../game/inbox.ts'
import { initialModel, update } from '../game/update.ts'
import { localizeHtml, translate } from './index.ts'

describe('Chinese mail and glossary views', () => {
  test('an existing funding letter translates both the preview and the inbox without changing stored mail', () => {
    const letter = ADVICE.round[4]!({ from: 'Sequel Capital', round: 'Pre-seed' })
    const inbox = mailed(
      EMPTY_INBOX,
      {
        key: 'round',
        sender: 'investor-sequel',
        subject: letter.subject,
        text: letter.body,
        actions: [{ id: 'raise', label: 'Raise' }],
        spam: false,
      },
      397,
      false,
    )
    const base = initialModel()
    const model = {
      ...base,
      prefs: { ...base.prefs, locale: 'zh-CN' as const },
      board: { ...base.board, inbox },
    }
    const original = JSON.stringify(inbox)
    for (const panelView of [peek, inboxPanel]) {
      Scene.scene(
        { update, view: (m, h) => localizeHtml(m.prefs.locale, panelView(m, h)) },
        Scene.given(model),
        Scene.expect(Scene.text('回复：回复：你的 天使轮（顶一下）')).toExist(),
        Scene.expect(
          Scene.text('嗨！再把这封信顶到收件箱上面，免得它被你凌晨三点的告警埋了。'),
        ).toExist(),
        Scene.expect(Scene.text('Needs action')).not.toExist(),
      )
    }
    Scene.scene(
      { update, view: (m, h) => localizeHtml('en', inboxPanel(m, h)) },
      Scene.given(model),
      Scene.expect(Scene.text(letter.subject)).toExist(),
    )
    expect(JSON.stringify(inbox)).toBe(original)
  })

  test('the annotation definition, explanation and source label translate and remain searchable', () => {
    const entry = GLOSSARY.find(({ id }) => id === 'annotation')!
    const base = initialModel()
    const model = {
      ...base,
      prefs: { ...base.prefs, locale: 'zh-CN' as const },
      glossary: { ...base.glossary, query: '注解' },
    }
    Scene.scene(
      { update, view: (m, h) => localizeHtml(m.prefs.locale, glossaryPanel(m, h)) },
      Scene.given(model),
      Scene.expect(Scene.text('注解')).toExist(),
      Scene.expect(Scene.text(entry.definition)).not.toExist(),
      Scene.expect(Scene.text(entry.inGame)).not.toExist(),
      Scene.expect(Scene.text('Learn more')).not.toExist(),
    )
    expect(translate('zh-CN', entry.definition)).toMatch(/时间序列/)
    expect(translate('zh-CN', entry.inGame)).toMatch(/蓝/)
  })

  test('new company and composed labels translate without losing dynamic values', () => {
    expect(translate('zh-CN', 'Company name')).toBe('公司名称')
    expect(translate('zh-CN', 'Share anonymous usage data')).toBe('分享匿名使用数据')
    expect(translate('zh-CN', 'Page view Insight 7.5')).toBe('页面浏览 洞察 7.5')
    expect(translate('zh-CN', 'Cloud: Out of memory')).toMatch(/^云服务：/)
    expect(translate('zh-CN', 'My own company')).toBe('My own company')
  })
})
