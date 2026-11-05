import { describe, expect, test } from 'vitest'
import { Scene } from 'foldkit/test'
import { inertHtml } from 'foldkit/html'
import * as Catalog from '@quorum/simulation/catalog'
import { CHALLENGES } from '@quorum/simulation/challenges'
import { GUIDED, TRACKS } from '@quorum/simulation/sandbox'
import * as Copy from '../game/copy/index.ts'
import { glossaryPanel } from '../components/lab/glossary.ts'
import { initialModel, update } from '../game/update.ts'
import { fr } from './fr.ts'
import { zhCN } from './zh-CN.ts'
import { localizeHtml, supportedLocales, translate } from './index.ts'

const paragraphs = (text: string): ReadonlyArray<string> => text.split(/\n\s*\n/)

/** These are the presentation fields the views read, never IDs or simulation settings. */
const copyFields = new Set([
  'name',
  'label',
  'blurb',
  'description',
  'condition',
  'goal',
  'tip',
  'term',
  'definition',
  'inGame',
  'title',
  'what',
  'sign',
  'effect',
  'hidden',
  'summary',
  'rule',
  'cause',
  'prevention',
  'question',
  'arrivals',
  'brief',
])
const catalogMessages = (value: unknown): ReadonlyArray<string> => {
  if (Array.isArray(value)) return value.flatMap(catalogMessages)
  if (value === null || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, field]) =>
    typeof field === 'string'
      ? copyFields.has(key) && /[A-Za-z]/.test(field)
        ? paragraphs(field)
        : []
      : catalogMessages(field),
  )
}

describe('localized presentation', () => {
  test('French is available by its native name', () => {
    expect(supportedLocales).toContainEqual({ value: 'fr', label: 'Français' })
  })

  test.each(['fr', 'zh-CN'] as const)(
    'all player-facing catalog and glossary fields have a %s entry',
    (locale) => {
      const dictionary = locale === 'fr' ? fr : zhCN
      const missing = catalogMessages([Catalog, CHALLENGES, GUIDED, TRACKS]).filter(
        (message) => !Object.hasOwn(dictionary, message) && translate(locale, message) === message,
      )
      expect([...new Set(missing)]).toEqual([])
    },
  )

  test.each(['fr', 'zh-CN'] as const)(
    'all %s dictionary placeholders survive translation, including reordered values',
    (locale) => {
      for (const [source, target] of Object.entries(locale === 'fr' ? fr : zhCN)) {
        expect(target.trim(), source).not.toBe('')
        expect(target.match(/\{\d+\}/g)?.sort() ?? [], source).toEqual(
          source.match(/\{\d+\}/g)?.sort() ?? [],
        )
        expect(target, source).not.toMatch(/ZX(?:PH|UNIT|END)\d*XZ/)
      }
      expect(translate('fr', 'Collect  $12.30')).toBe('Encaisser  $12.30')
      expect(translate('fr', 'Server · cold')).toBe('Serveur · à froid')
      expect(translate('fr', 'Seed round at 1.2k users')).toBe('Levée Amorçage à 1.2k utilisateurs')
      expect(translate('fr', '1 users')).toBe('1 utilisateur')
      expect(translate('fr', '12 users')).toBe('12 utilisateurs')
      expect(translate('fr', '0.4 / 2 GB')).toBe('0.4 / 2 Go')
      expect(translate('fr', 'Pagination, Paid plans')).toBe('Pagination, Forfaits payants')
      expect(translate('fr', 'tiny · Burstable')).toBe('micro · À capacité extensible')
      expect(translate('fr', 'small  $1.44k')).toBe('petite · $1.44k')
      expect(translate('fr', 'PostgreSQL')).toBe('PostgreSQL')
      expect(translate('fr', 'EU 80 ms')).toBe('EU 80 ms')
      for (const { label } of supportedLocales) expect(translate('fr', label)).toBe(label)
      expect(translate('fr', 'Custom')).toBe('Custom')
      expect(translate('fr', 'Untitled')).toBe('Untitled')
      expect(translate('fr', 'My custom graph')).toBe('My custom graph')
      expect(translate('fr', '4h')).toBe('4 h')
      expect(translate('fr', '4d')).toBe('4 j')
      expect(translate('fr', 'constructor')).toBe('constructor')
      expect(translate('fr', 'Unknown prose with Server in it')).toBe(
        'Unknown prose with Server in it',
      )
      expect(translate('en', 'Research')).toBe('Research')
      expect(translate('zh-CN', 'Research')).toBe('研究')
    },
  )

  test.each(['fr', 'zh-CN'] as const)(
    'every mail variant translates its subject and paragraphs in %s, including conditional advisories',
    (locale) => {
      const dictionary = locale === 'fr' ? fr : zhCN
      const missing = new Set<string>()
      const vars = {
        action: 'Restart',
        alert: 'Error rate above 5%',
        backlog: '12',
        causes: '- API read: slow from far away\n\n- Checkout: timeouts',
        inADay: '79',
        perHour: '59',
        region: 'Asia-Pacific',
        exposed: 'Server',
        features: 'Pagination',
        from: 'Pat Mutex',
        id: 'CVE-2026-1337',
        incident: 'Memory leak',
        item: 'Pagination',
        kind: 'API read',
        node: 'Server',
        round: 'Seed',
        runtime: 'PHP',
        score: 9.8,
        seconds: '30',
        severity: 'critical',
        share: '25%',
        title: 'HTTP proxy request smuggling',
        users: '1.2k',
        what: 'A crafted request hides a second request inside the first, and the proxy forwards both. Your server then answers a question nobody at the front door saw anyone ask.',
        zone: 'Zone A',
      }
      const visit = (value: unknown) => {
        if (typeof value === 'function') {
          for (const exposed of ['Server', null]) {
            const letter = value({ ...vars, exposed }) as Copy.Written
            for (const text of [letter.subject, ...paragraphs(letter.body)]) {
              const signature =
                /^(?:[—-] )?(?:Pat Mutex|Pat|Tyler|Madison|Derek|Chad\nPat Mutex|Ava @ Pat Mutex|comptime\.?)$/.test(
                  text,
                )
              const identifier = /^CVE-\d+-\d+ \([\d.]+\)$/.test(text)
              if (
                /[A-Za-z]{2,}/.test(text) &&
                !signature &&
                !identifier &&
                !Object.hasOwn(dictionary, text) &&
                translate(locale, text) === text
              )
                missing.add(text)
            }
          }
        } else if (Array.isArray(value)) value.forEach(visit)
        else if (value !== null && typeof value === 'object') Object.values(value).forEach(visit)
      }
      for (const value of [
        Copy.ADVICE,
        Copy.EVENTS,
        Copy.SPAM,
        Copy.CVE_LETTERS,
        Copy.HIRE,
        Copy.REWRITES,
        Copy.TICKETS,
        Copy.CHURN_LETTERS,
      ])
        visit(value)
      expect([...missing]).toEqual([])
    },
  )

  test('the Churn breakdown and its Mail translate in French and Chinese', () => {
    const cases: ReadonlyArray<readonly [string, string, string]> = [
      ['Why users leave', 'Pourquoi les utilisateurs partent', '用户为何流失'],
      ['−14.4%/h', '−14.4 %/h', '−14.4%/小时'],
      ['1 day: 13.2k', 'Dans 1 jour : 13.2k', '1 天后：13.2k'],
      ['Open Asia-Pacific', 'Ouvrir l’Asie-Pacifique', '开通亚太'],
      ['Show Load Balancer', 'Afficher Répartiteur de charge', '查看负载均衡器'],
      [
        'Asia-Pacific: users are leaving',
        'Asie-Pacifique : des utilisateurs partent',
        '亚太：用户正在流失',
      ],
      [
        '- API read: slow from far away',
        '- Lecture API : lent depuis l’étranger',
        '- API 读取：跨地域访问太慢',
      ],
    ]
    for (const [english, french, chinese] of cases) {
      expect(translate('fr', english)).toBe(french)
      expect(translate('zh-CN', english)).toBe(chinese)
    }
  })

  test('French glossary search respects categories', () => {
    const model = {
      ...initialModel(),
      prefs: { ...initialModel().prefs, locale: 'fr' as const },
      glossary: { ...initialModel().glossary, query: 'contre-pression' },
    }
    Scene.scene(
      { update, view: glossaryPanel },
      Scene.given(model),
      Scene.expect(Scene.text('Backpressure')).toExist(),
    )
    Scene.scene(
      { update, view: glossaryPanel },
      Scene.given({ ...model, glossary: { ...model.glossary, category: 'security' } }),
      Scene.expect(Scene.text('No matches')).toExist(),
    )
  })

  test('French glossary search accepts unaccented input', () => {
    Scene.scene(
      { update, view: glossaryPanel },
      Scene.given({
        ...initialModel(),
        prefs: { ...initialModel().prefs, locale: 'fr' },
        glossary: { ...initialModel().glossary, query: 'repartiteur de charge' },
      }),
      Scene.expect(Scene.text('Load balancer')).toExist(),
    )
  })

  test('French localizes accessible copy while preserving input values, links, events and keys', () => {
    const h = inertHtml
    const node = h.input([
      h.Key('Research'),
      h.Value('Research'),
      h.Placeholder('Search…'),
      h.AriaLabel('Research'),
      h.Title('Research'),
    ])!
    const original = JSON.stringify(node)
    const localized = localizeHtml('fr', node)!
    expect(localized.key).toBe(node.key)
    expect(localized.identity).toBe(localizeHtml('en', node)!.identity)
    expect(localized.data?.props).toMatchObject({
      value: 'Research',
      placeholder: 'Rechercher…',
      title: 'Recherche',
    })
    expect(localized.data?.attrs?.['aria-label']).toBe('Recherche')
    expect(JSON.stringify(node)).toBe(original)
  })
})
