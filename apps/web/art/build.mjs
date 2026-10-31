// Builds the component illustrations with the vendored Anatomy kit.
//
//   node apps/web/art/build.mjs            every figure in figures/
//   node apps/web/art/build.mjs app db     only these figures
//
// Each figure module exports `figure()`, which returns { width, height, label, body } and
// optionally a `theme` ('light' by default, or 'dark'). The SVG lands in
// apps/web/public/art/<name>.svg with the Quorum theme embedded, so an <img> shows it
// with the game's blueprint palette.

import { readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as k from './kit/iso-kit.mjs'
import { QUORUM_CSS } from './theme.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'public', 'art')
const only = process.argv.slice(2)

const names = readdirSync(join(HERE, 'figures'))
  .filter((file) => file.endsWith('.mjs'))
  .map((file) => basename(file, '.mjs'))
  .filter((name) => only.length === 0 || only.includes(name))

for (const name of names) {
  const module = await import(pathToFileURL(join(HERE, 'figures', `${name}.mjs`)).href)
  const { width, height, label, body, theme = 'light' } = module.figure()
  const svg = k
    .figureSvg({ width, height, label, body, standalone: theme })
    .replace(`<style>${k.ISO_CSS}</style>`, `<style>${k.ISO_CSS}${QUORUM_CSS}</style>`)
  writeFileSync(join(OUT, `${name}.svg`), svg)
  console.log(`wrote public/art/${name}.svg`)
}
