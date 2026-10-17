import type { Html, HtmlBuilder } from 'foldkit/html'
import type { Message } from '../message.ts'
import type { Model, Route } from '../model.ts'
import { titleScreen } from './title.ts'
import { howToScreen } from './how-to.ts'
import { scenariosScreen } from './scenarios.ts'
import { briefingScreen } from './briefing.ts'
import { createRoomScreen } from './create-room.ts'
import { joinRoomScreen } from './join-room.ts'
import { lobbyScreen } from './lobby.ts'
import { runScreen } from './run.ts'
import { reportScreen } from './report.ts'

export type ScreenView = (model: Model, h: HtmlBuilder<Message>) => Html

/** Every screen Quorum has, keyed by the route that shows it. */
export const screens: Record<Route, ScreenView> = {
  menu: titleScreen,
  howto: howToScreen,
  scenarios: scenariosScreen,
  briefing: briefingScreen,
  create: createRoomScreen,
  join: joinRoomScreen,
  lobby: lobbyScreen,
  run: runScreen,
  report: reportScreen,
}

export const activeScreen = (model: Model, h: HtmlBuilder<Message>): Html =>
  screens[model.route](model, h)
