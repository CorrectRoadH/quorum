## What it does

The LLM API stands for a hosted model: someone else's GPUs, behind an API.

It takes inference calls from your App Servers and sends nothing on. It is a Managed Component. It costs nothing to place, serves every region, and bills for each token it serves. Each prompt waits a fixed time for the first token, longer than a [GPU Node](/components/gpu). See [model inference](/glossary/model-inference).

It is rate limited. Each size step is a usage tier that doubles how many prompts per second it takes. Past the limit, prompts fail at once as `throttled`. See [rate limiting](/glossary/rate-limiting).

## When to place it

Place it when you ship your first AI Feature. It needs no operations work, and it costs nothing while traffic is low. It unlocks with [Hosted models](/research/hosted-models).

Move steady load to a GPU Node when the token bill grows large. The LLM API stays cheaper than a GPU Node that runs mostly idle.

## How it fails

- Past its tier, prompts fail as `throttled`. A [Traffic spike](/incidents/spike) can push you over the limit. Resize it before peak.
- Its cost grows with every prompt. Watch third-party costs in the Ledger.
- Every prompt waits for the first token, so the AI prompt p99 stays high.

The LLM API also protects you. During a [GPU shortage](/incidents/gpu-shortage), an App Server linked to both a GPU Node and the LLM API keeps serving prompts.

## Tips

- Keep an LLM API linked as a backup even after you place GPU Nodes.
- Compare its token bill with a busy GPU Node's Burn before you switch.
