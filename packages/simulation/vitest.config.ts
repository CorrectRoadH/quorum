import { availableParallelism } from 'node:os'
import { configDefaults, defineConfig } from 'vitest/config'

// `engines/` holds the cross-engine check, which `pnpm test:golden` runs in browsers.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'engines/**'],
    // The tests are CPU-bound and the main process idles, so use every core, not Vitest's default of one fewer.
    maxWorkers: availableParallelism(),
  },
})
