import { describe, expect, test } from 'vitest'
import { newGame, preseedGame } from '@quorum/simulation/company'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { AppRoute } from './route.ts'
import { initialModel, update } from './update.ts'
import { publish, readTool, stateJson } from './webmcp.ts'

const company: Model = { ...initialModel(), route: AppRoute.Company(), game: preseedGame() }

const withChallenge = (): Model =>
  update(
    { ...initialModel(), saved: true, game: newGame() },
    Message.ChallengeStarted({ id: 'hello-world' }),
  ).model

describe('what an agent may read', () => {
  test('a Company answers, and an unknown tool does not', () => {
    publish(company)
    expect(JSON.parse(readTool('get_company'))).toMatchObject({ mode: 'company' })
    expect(() => readTool('place_node')).toThrow('Unknown tool')
  })

  test('an open Challenge answers nothing, through the tools or the JSON button', () => {
    const challenge = withChallenge()
    expect(challenge.challenge).not.toBeNull()
    publish(challenge)
    expect(() => readTool('get_design')).toThrow('Challenges are scored')

    const copied = update(challenge, Message.StateCopied())
    expect((copied.commands ?? []).map((command) => command.name)).not.toContain('CopyText')
    expect(copied.model.toast?.message).toContain('Challenges are scored')
    // The same press on a Company copies its state.
    expect(
      update(company, Message.StateCopied()).commands?.map((command) => command.name),
    ).toContain('CopyText')
    expect(JSON.parse(stateJson(company))).toHaveProperty('design.nodes')
  })
})

describe('Agent access', () => {
  test('is off until the player turns it on, and is saved and applied when they do', () => {
    expect(company.prefs.agentAccess).toBe(false)
    const on = update(company, Message.AgentAccessToggled())
    expect(on.model.prefs.agentAccess).toBe(true)
    expect(on.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'ApplySettings',
          args: expect.objectContaining({ agentAccess: true }),
        }),
        expect.objectContaining({
          name: 'WritePrefs',
          args: expect.objectContaining({ prefs: expect.objectContaining({ agentAccess: true }) }),
        }),
      ]),
    )
  })

  test('stays off for preferences saved before it existed, and returns when saved on', () => {
    const load = (prefs: object) =>
      update(initialModel(), Message.PrefsLoaded({ json: JSON.stringify(prefs) })).model
    expect(load({ locale: 'en', muted: true, motion: 'system' }).prefs.agentAccess).toBe(false)
    expect(
      load({ locale: 'en', muted: false, motion: 'system', agentAccess: true }).prefs.agentAccess,
    ).toBe(true)
  })
})
