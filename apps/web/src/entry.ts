import { Runtime } from 'foldkit'
import { init, Message, Model, subscriptions, update, view } from './app/main.ts'
import { startMotion } from './game/motion.ts'
import { PREFS_KEY } from './game/commands.ts'
import { publish } from './game/agent-tools.ts'
import { observe } from './platform/analytics.ts'
import { ApiRpc } from './platform/rpc.ts'
import { reportCrash, reportSlow, startSentry, timedUpdate } from './platform/sentry.ts'
import './styles.css'

// First, so errors while the app boots are caught too.
startSentry(PREFS_KEY)

const application = Runtime.makeApplication({
  Model,
  init,
  update: (model, message) => {
    const result = timedUpdate(message, () => update(model, message))
    publish(result.model)
    observe(result.model)
    return result
  },
  view,
  subscriptions,
  routing: {
    onUrlRequest: (request) => Message.ClickedLink({ request }),
    onUrlChange: (url) => Message.ChangedUrl({ url }),
  },
  resources: ApiRpc.layer,
  container: document.getElementById('root'),
  // The clock and its board sync fire 8 times a second and would push every gesture out of history.
  crash: { report: reportCrash },
  // Over a phase's budget, Foldkit tells Sentry which Message was slow. Under it, nothing is sent.
  slow: { show: 'Always', onSlow: reportSlow },
  devTools: { Message, excludeFromHistory: ['Ticked', 'Synced', 'DashboardChanged'] },
})

// Surfaces opened from the keyboard skip their entrance (see styles.css): shortcuts must feel instant.
const root = document.documentElement
addEventListener('keydown', () => (root.dataset['input'] = 'keyboard'), true)
addEventListener('pointerdown', () => (root.dataset['input'] = 'pointer'), true)

// Foldkit replaces the container it renders into, so motion watches the body.
startMotion(document.body)

Runtime.run(application)
