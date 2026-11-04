## What it does

Object Storage stands for Amazon S3: a store for files that grows without limit.

It takes object puts and object gets: uploaded files and video. It sends nothing on. It has no capacity limit, and each request waits for the first byte, which is slower than a database query. See [object storage](/glossary/object-storage).

Its Burn grows with the data it holds, and that data never shrinks. Every upload adds to it.

Until you link Object Storage, the [Database](/components/database) stores files as rows. When an App Server links to both, files go to Object Storage, and Postgres stops taking them.

## When to place it

Place it when uploads and video load the Database: its CPU and latency climb as the Upload or Video share of the mix grows. It unlocks with [Object storage](/research/object-storage).

## How it fails

Object Storage does not overload or fail in the game. Its problems are latency and cost.

- First-byte latency adds to every video and upload. A [CDN](/components/cdn) answers most video at the edge.
- Storage Burn only grows. Check it in the Ledger as the Company ages.
- A slow upload holds an App Server slot while the file comes up the wire. Send uploads through a [Queue](/components/queue) so the App Server keeps only the short sync part. The [Slow Uploads](/sandboxes/slow-uploads) Sandbox shows it.

::Sandbox{id="slow-uploads"}

## Tips

- Pair Object Storage with a CDN once you serve video.
- Link Workers to Object Storage when you send uploads through a Queue.
