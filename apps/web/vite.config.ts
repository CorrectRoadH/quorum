import { foldkit } from '@foldkit/vite-plugin'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

/**
 * Source maps go to Sentry only from a build that has the upload token, and never into the
 * deployed assets: hidden maps carry no link in the bundle, and the plugin deletes them after.
 */
const authToken = process.env.SENTRY_AUTH_TOKEN
const release = process.env.VITE_SENTRY_RELEASE

export default defineConfig({
  build: { sourcemap: authToken ? 'hidden' : false },
  plugins: [
    tailwindcss(),
    foldkit(),
    // Last, so it sees the final bundle.
    authToken
      ? sentryVitePlugin({
          authToken,
          // The plugin reads SENTRY_ORG and SENTRY_PROJECT from the environment itself.
          ...(release ? { release: { name: release } } : {}),
          sourcemaps: {
            // Alchemy builds the Worker (`dist/ssr`) first and the assets (`dist/client`) second,
            // and ships only `index.js` of the first and everything in the second. So every
            // build uploads both directories, and only the public assets lose their maps.
            assets: ['./dist/ssr/**', './dist/client/**'],
            filesToDeleteAfterUpload: ['./dist/client/**/*.map'],
          },
        })
      : null,
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    dedupe: ['effect', 'foldkit'],
  },
})
