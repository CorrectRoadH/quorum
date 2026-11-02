// Runs the golden hash and every Challenge's reference replay in workerd, the
// Workers runtime, and compares them with the hashes Node committed. Wall time
// is measured from here: inside a Worker the clock stops while code runs.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
const here = fileURLToPath(new URL('.', import.meta.url))
const workerd = join(require.resolve('workerd/package.json'), '..', 'bin', 'workerd')
const PORT = 8_791
const dir = mkdtempSync(join(tmpdir(), 'quorum-workerd-'))

const { GOLDEN_HASH, REFERENCE_HASHES } = await import('../src/fixtures/golden.ts')
const expected = { golden: GOLDEN_HASH, challenges: REFERENCE_HASHES }

await build({
  entryPoints: [join(here, 'workerd.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  outfile: join(dir, 'worker.js'),
  logLevel: 'error',
})
writeFileSync(
  join(dir, 'config.capnp'),
  `using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (
  services = [(name = "main", worker = .worker)],
  sockets = [(name = "http", address = "127.0.0.1:${PORT}", http = (), service = "main")],
);
const worker :Workerd.Worker = (
  modules = [(name = "worker.js", esModule = embed "worker.js")],
  compatibilityDate = "2026-10-08",
);
`,
)

const server = spawn(workerd, ['serve', join(dir, 'config.capnp')], {
  stdio: ['ignore', 'inherit', 'inherit'],
})
const stop = () => {
  server.kill()
  rmSync(dir, { recursive: true, force: true })
}

const fetchText = async (path) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}${path}`)
      return await response.text()
    } catch (error) {
      if (attempt > 50) throw error
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

let failed = 0
const check = async (label, path, want) => {
  const started = performance.now()
  const got = await fetchText(path)
  const ms = (performance.now() - started).toFixed(0)
  const ok = got === want
  if (!ok) failed += 1
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} workerd ${label}: ${got}${ok ? '' : ` (Node: ${want})`} in ${ms} ms`,
  )
}

try {
  await fetchText('/challenges')
  await check('golden', '/golden', expected.golden)
  for (const [id, hash] of Object.entries(expected.challenges))
    await check(id, `/challenge/${id}`, hash)
} finally {
  stop()
}
process.exitCode = failed > 0 ? 1 : 0
