import { markdown } from '@foldkit/markdown/vite'
import { foldkit } from '@foldkit/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { Frontmatter } from './src/frontmatter.ts'
import { islandAttributes } from './src/islands.ts'
import { WIKI_ORIGIN } from './src/site.ts'

/* Every page is rendered at build time from src/entry.server.ts and hydrated by src/entry.ts
   (ADR 0009). Markdown in content/ compiles to data, validated against the frontmatter and
   island schemas, so a bad page fails the build. */
export default defineConfig({
  plugins: [
    tailwindcss(),
    foldkit({
      ssr: {
        serverEntry: '/src/entry.server.ts',
        clientEntry: '/src/entry.ts',
        build: { prerender: { origin: WIKI_ORIGIN } },
      },
    }),
    markdown({ frontmatter: Frontmatter, islands: islandAttributes }),
  ],
  resolve: { dedupe: ['effect', 'foldkit'] },
})
