# Zig and Haskell runtime profiles

Researched 2026-11-04 against primary documentation. The Zig download index lists 0.17.1 as the
latest release, separate from development builds [Z1]. GHC sources below describe 9.14.1, and Warp
sources describe 3.4.20. This note proposes game content, not measured performance rankings.

## Documented behavior

| Language | Fact                                                                                                                                                                                                                                                                                                    | Consequence for the game                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zig      | Zig performs no automatic memory management. Allocating APIs conventionally accept an explicit allocator. The programmer owns pointer lifetimes [Z2].                                                                                                                                                   | No tracing-GC pause, but not leak immunity or Rust-style ownership checking.                                                                                                                                       |
| Zig      | The allocator guide recommends an arena for request-scoped allocations when everything can be freed together. `arena.deinit()` releases those allocations [Z3].                                                                                                                                         | A manual-memory server can reclaim request memory without collecting a shared heap. Persistent application state can still leak.                                                                                   |
| Zig      | `std.Thread.spawn` creates OS threads [Z4, Z6]. The language reference still says language-level async functions regressed in 0.11.0 [Z5]. However, current `std.Io` has library-level `async` and `concurrent` APIs, a `Threaded` implementation, and platform-dependent evented implementations [Z6]. | Choose an explicit threaded server profile. Neither "Zig has no concurrency" nor "Zig is automatically Tokio-like" is accurate. The proposed slot limit describes this server configuration, not every Zig server. |
| Haskell  | GHC schedules lightweight `forkIO` threads in its runtime. Waiting for socket readiness suspends the Haskell thread rather than requiring one OS thread per connection [H1].                                                                                                                            | The existing `green` model fits better than `threads` or `loop`.                                                                                                                                                   |
| Haskell  | Multicore execution requires linking with `-threaded` and selecting multiple capabilities, for example `+RTS -N`. Omitting `-N` means one capability. Each capability executes one Haskell thread at a time, and threads migrate between capabilities [H2].                                             | `parallel: true` assumes an explicitly configured multicore server, not the compiler default. One request does not automatically use all cores.                                                                    |
| Haskell  | GHC uses preemptive scheduling, but preemption depends on allocation points. Nonallocating loops and unsafe foreign calls are exceptions [H1, H2].                                                                                                                                                      | No ordinary event-loop blocking penalty. Do not promise BEAM-style isolation or universally flat p99.                                                                                                              |
| Haskell  | GHC's default collector is generational, copying, and stop-the-world. Parallel collection uses multiple cores but still pauses execution. The optional nonmoving collector makes oldest-generation collection concurrent [H2, H3].                                                                      | Model a shared GC pause and CPU cost. Do not label the default collector pause-free or per-thread.                                                                                                                 |
| Haskell  | Warp is an HTTP server for WAI applications. Its default fork operation is `forkIOWithUnmask`; its implementation forks a worker per connection and handles connection exceptions [H4, H5].                                                                                                             | Name the runtime "Haskell (GHC + Warp)". WAI is the application interface, not a runtime or a full application framework. A server unlock needs no separate framework unlock.                                      |

## Proposed catalog values

Every number below is an initial balance choice, including hiring, salary, build time, memory,
startup, GC, and speed. These are not benchmark results, vendor defaults, or real pause guarantees.
The axes use the existing 1–5 scale, where higher is better.

| `LanguageDef` field | Zig          | Haskell              |
| ------------------- | ------------ | -------------------- |
| `id`, `name`        | `zig`, `Zig` | `haskell`, `Haskell` |
| `velocity`          | `0.7`        | `1.15`               |
| `salary`            | `1.25`       | `1.4`                |
| `hireTime`          | `3`          | `2.5`                |
| `buildMinutes`      | `6`          | `8`                  |

| `RuntimeDef` field     | Zig                                                                                 | Haskell                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `id`, `language`       | `zig`, `zig`                                                                        | `warp`, `haskell`                                                                   |
| `name`                 | `Zig threaded server`                                                               | `Haskell (GHC + Warp)`                                                              |
| `model`                | `threads`                                                                           | `green`                                                                             |
| `speed`                | `1.3`                                                                               | `0.85`                                                                              |
| `memory`               | `24` MB per process                                                                 | `80` MB per process                                                                 |
| `pool`, `threads`      | `false`, `64`                                                                       | `false`, `1`                                                                        |
| `connections`          | `10`                                                                                | `10`                                                                                |
| `persistent`           | `true`                                                                              | `true`                                                                              |
| `startup`              | `0` seconds                                                                         | `1` second                                                                          |
| `warmFrom`, `warmup`   | `1`, `0`                                                                            | `1`, `0`                                                                            |
| `parallel`, `blocking` | `true`, `null`                                                                      | `true`, `null`                                                                      |
| `gc`                   | `null`                                                                              | `{ pauseMs: 12, cpu: 0.15 }`                                                        |
| `connectionKB`         | `256`                                                                               | `16`                                                                                |
| `research`             | `lang-zig`                                                                          | `lang-haskell`                                                                      |
| `axes`                 | `{ throughput: 5, tail: 4, memory: 4, velocity: 2, resilience: 2, operability: 2 }` | `{ throughput: 4, tail: 3, memory: 3, velocity: 4, resilience: 4, operability: 1 }` |
| `glossary`             | `['thread-pool', 'blast-radius']`                                                   | `['green-threads', 'gc-pause']`                                                     |

Suggested blurbs:

- Zig: "Native code with explicit allocators and no GC. A 64-thread server uses every core, but
  each waiting request holds a thread. Persistent state can leak."
- Haskell: "Warp runs lightweight GHC threads across cores. Productive specialists, but slower
  builds and hiring. I/O waits hold no OS thread; shared-heap GC adds pauses and CPU cost."

Zig trades cheap native CPU and no GC for bounded I/O concurrency, manual lifetime management,
and slower hiring. It is not a cheaper copy of Tokio's unbounded-task model. Haskell trades
multicore, lightweight concurrency for shared-heap GC and more memory than Go. Neither profile
claims a language-wide speed ordering. Both start with the existing `none` framework.

The initial proposal used Haskell velocity 0.8. The implemented value is 1.15 with a 1.4 salary
factor. Specialists ship features faster once hired, at a higher cost than Go's developers.
Haskell also trades away Go's shorter builds, faster hiring, CPU speed, and memory budget.
This gives Haskell a measurable advantage in the existing Team model, rather than only a radar
rating. The velocity axis is 4, and operability is 1 for the long builds and specialist hiring.
These are balance choices, not empirical productivity claims. Live balance still needs playtesting.

## Research placement

| Field          | Zig                 | Haskell                   |
| -------------- | ------------------- | ------------------------- |
| `id`, `name`   | `lang-zig`, `Zig`   | `lang-haskell`, `Haskell` |
| `track`, `era` | `runtimes`, `3`     | `runtimes`, `3`           |
| `cost`         | `3500`              | `3000`                    |
| `requires`     | `[]`                | `[]`                      |
| `blurb`        | Runtime blurb above | Runtime blurb above       |

Era 3 is Series A, beside Elixir at 2500 and Rust at 4000 Insight. This is an adoption-complexity
choice, not a claim about release dates. No language requires learning another language first.
With the existing Era 3 recipe multiplier, the effective costs are 2625 each of `search` and
`upload` Insight for Zig, and 2250 each for Haskell. The base Study duration is 240 seconds.

## Existing-model limits

The relevant local sources are [GDD 06](../gdd/06-runtimes.md),
[the runtime catalog](../../packages/simulation/src/catalog/runtimes.ts),
[the research catalog](../../packages/simulation/src/catalog/research.ts), and
[`serverModel`](../../packages/simulation/src/capacity.ts).

- `pool: true` multiplies processes and process memory. It does not configure a thread pool.
  Zig therefore uses `pool: false` with a fixed `threads: 64`. A future thread-count control
  would need a separate mechanic.
- Zig's 24 MB base memory and 256 KB per realtime connection are game budgets, not OS stack-size
  defaults. The model does not charge stacks for ordinary in-flight threaded requests or reserve
  a slot for each idle realtime connection. Do not present this profile as exact thread accounting.
- `green` has unlimited request slots in the current solver. Haskell's 16 KB connection cost
  includes an abstract allowance for stacks and buffers, not a measured `forkIO` stack size.
- GC starts only above the solver's 70% memory threshold. Real GHC also collects below that
  threshold. A fixed pause cannot express live-data volume, allocation rate, per-capability
  nurseries, or the optional nonmoving collector.
- `persistent` enables existing leak behavior. It cannot distinguish Zig ownership bugs from
  Haskell retained objects. The axes are descriptive ratings, not extra runtime penalties.
  The model has no field for Zig memory corruption or Warp exception isolation.
- Hiring and velocity factors have no empirical evidence here. Rebalance through playtests,
  not claims that official language documentation proves salaries or developer productivity.

## Primary sources

- [Z1] Zig release index: <https://ziglang.org/download/index.json>.
- [Z2] Zig 0.17.1, memory and ownership:
  <https://ziglang.org/documentation/0.17.1/#Memory> and
  <https://ziglang.org/documentation/0.17.1/#Lifetime-and-Ownership>.
- [Z3] Zig allocator selection: <https://ziglang.org/documentation/0.17.1/#Choosing-an-Allocator>.
- [Z4] Zig thread example: <https://ziglang.org/documentation/0.17.1/#Thread-Local-Variables>.
- [Z5] Zig language async status: <https://ziglang.org/documentation/0.17.1/#Async-Functions>.
- [Z6] Zig 0.17.1 standard-library documentation:
  <https://ziglang.org/documentation/0.17.1/std/>. Its official source archive is
  <https://ziglang.org/documentation/0.17.1/std/sources.tar>; inspected `std/Io.zig`,
  `std/Io/Threaded.zig`, and `std/Thread.zig`. Library async is distinct from language async.
- [H1] GHC `Control.Concurrent`, lightweight threads, I/O waiting, and preemption:
  <https://downloads.haskell.org/ghc/9.14.1/docs/libraries/base-4.22.0.0-66f8/Control-Concurrent.html>.
- [H2] GHC concurrency and SMP configuration:
  <https://downloads.haskell.org/ghc/9.14.1/docs/users_guide/using-concurrent.html>.
- [H3] GHC collector options, including copying and nonmoving collectors:
  <https://downloads.haskell.org/ghc/9.14.1/docs/users_guide/runtime_control.html#rts-options-to-control-the-garbage-collector>.
- [H4] Warp server API and `setFork` default:
  <https://hackage.haskell.org/package/warp-3.4.20/docs/Network-Wai-Handler-Warp.html#v:setFork>.
- [H5] Warp connection workers and exception handling:
  <https://hackage.haskell.org/package/warp-3.4.20/src/Network/Wai/Handler/Warp/Run.hs>.
