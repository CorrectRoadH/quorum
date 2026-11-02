import { Runtime } from 'foldkit'
import { init, Message, Model, subscriptions, update, view } from './app/main.ts'
import { startMotion } from './game/motion.ts'
import { ApiRpc } from './platform/rpc.ts'
import './styles.css'

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  subscriptions,
  routing: {
    onUrlRequest: (request) => Message.ClickedLink({ request }),
    onUrlChange: (url) => Message.ChangedUrl({ url }),
  },
  resources: ApiRpc.layer,
  container: document.getElementById('root'),
  devTools: { Message },
})

// Surfaces opened from the keyboard skip their entrance (see styles.css): shortcuts must feel instant.
const root = document.documentElement
addEventListener('keydown', () => (root.dataset['input'] = 'keyboard'), true)
addEventListener('pointerdown', () => (root.dataset['input'] = 'pointer'), true)

// Foldkit replaces the container it renders into, so motion watches the body.
startMotion(document.body)

Runtime.run(application)
