import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

/** The cross-engine golden check (`pnpm test:golden`): the same hashes in Chromium, Firefox and WebKit. */
export default defineConfig({
  test: {
    include: ['engines/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
  },
})
