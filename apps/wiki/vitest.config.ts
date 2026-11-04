import { markdown } from '@foldkit/markdown/vite'
import { foldkit } from '@foldkit/vite-plugin'
import { defineConfig } from 'vitest/config'
import { Frontmatter } from './src/frontmatter.ts'
import { islandAttributes } from './src/islands.ts'

// Tests compile Markdown exactly as the build does.
export default defineConfig({
  plugins: [foldkit(), markdown({ frontmatter: Frontmatter, islands: islandAttributes })],
  resolve: { dedupe: ['effect', 'foldkit'] },
})
