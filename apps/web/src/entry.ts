import { Runtime } from 'foldkit'
import { init, Message, Model, subscriptions, update, view } from './app/main.ts'
import './styles.css'

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  subscriptions,
  container: document.getElementById('root'),
  devTools: { Message },
})

// Surfaces opened from the keyboard skip their entrance (see styles.css): shortcuts must feel instant.
const root = document.documentElement
addEventListener('keydown', () => (root.dataset['input'] = 'keyboard'), true)
addEventListener('pointerdown', () => (root.dataset['input'] = 'pointer'), true)

Runtime.run(application)
