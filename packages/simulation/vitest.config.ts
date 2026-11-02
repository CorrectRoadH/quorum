import { configDefaults, defineConfig } from 'vitest/config'

// `engines/` holds the cross-engine check, which `pnpm test:golden` runs in browsers.
export default defineConfig({ test: { exclude: [...configDefaults.exclude, 'engines/**'] } })
