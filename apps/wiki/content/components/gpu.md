## What it does

The GPU Node stands for a model server such as vLLM on rented NVIDIA GPUs.

It takes inference calls from your App Servers and sends nothing on. Its capacity is measured in tokens per second, and each AI prompt uses a fixed number of tokens. Each size step doubles the GPUs, and with them its capacity and Burn. See [model inference](/glossary/model-inference).

The **GPU type** sets the tradeoff. T4 is cheap and slow. A100 is balanced. H100 is the cheapest per token and the hardest to get. Changing the type restarts the Node.

A new or restarted GPU Node starts cold: it loads its model and serves at a fraction of its capacity until it warms up.

## When to place it

Place it when AI prompts are a large share of your traffic and the [LLM API](/components/llm) bill is a large line in the Ledger. A GPU Node bills for every second it runs, busy or not. It is cheaper per token than the LLM API only while it stays busy. It unlocks with [Model serving](/research/model-serving).

## How it fails

- Overloaded, it drops prompts. AI prompts are a high-value kind, so this costs revenue fast.
- Idle, it burns money. Size it to your steady AI load.
- [GPU shortage](/incidents/gpu-shortage): the provider reclaims a GPU Node, and no H100 capacity exists that month. Link the LLM API too, so prompts have somewhere to go.
- [Instance failure](/incidents/instance) takes a single copy offline. It comes back cold.

## Tips

- Run a GPU Node for the steady load and the LLM API for spikes.
- Avoid H100 when you cannot afford a shortage.
