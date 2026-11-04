import { Runtime } from 'foldkit'
import { Message, Model, init, update } from './main.ts'
import { subscriptions } from './subscriptions.ts'
import { view } from './view.ts'
import './styles.css'

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  subscriptions,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: (request) => Message.ClickedLink({ request }),
    onUrlChange: (url) => Message.ChangedUrl({ url }),
  },
  devTools: { Message },
})

// Every page was rendered at build time; the client adopts it (ADR 0009).
Runtime.hydrate(application)
