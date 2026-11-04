## What it does

Analytics stands for an OpenTelemetry collector with a tracing backend: the system that records what your requests did.

Analytics is a tap. Link any Node into it, and it receives a copy of that Node's traffic, not a share of it. It samples that copy at the sample rate you set. Each sample earns Insight in the pool of its request kind. A request that fails or frustrates its user also earns Failure Insight, and it teaches more than a healthy one.

Insight grows with the square root of samples, counted per Component type and kind. So tapping many different Components teaches more than tapping one large one. [Insight and observability](/explanation/observability) covers the full model.

Analytics keeps a limited number of samples per second. Each size step doubles it. Beyond that, it drops samples evenly. Retention sets how long it keeps traces, and a longer window costs more Burn.

## When to place it

The Garage board starts with one Analytics Node linked to the App Server. Add links when Insight for a kind grows slowly, or when a new Component carries traffic you have not sampled yet. Resize it when its card shows it at full throughput.

## How it fails

Analytics never breaks a request, but it has costs.

- Overloaded, it drops samples, and Insight slows.
- A high sample rate adds CPU and latency to every tapped Node, and it multiplies storage Burn.
- Without Analytics, you earn no Insight from traffic, and Research stalls.

No incident targets Analytics.

:::Note{tone="real"}
Real tracing systems sample too. Keeping every trace is expensive, and a small sample already shows the common paths. See [distributed tracing](/glossary/distributed-tracing) and [observability](/glossary/observability).
:::

## Tips

- Tap one Node of each Component type before you raise the sample rate.
- Lower the sample rate on hot App Servers if p99 matters more than Insight.
