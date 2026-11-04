# The wiki is a separate prerendered app

Players need one place to learn how Quorum works: what each Component does, why a Design breaks,
and how to fix it. Upload Labs players quit partly because "this game barely has any
documentation" ([Influences](../gdd/02-influences.md#why-players-quit)). The wiki lives in
`apps/wiki` and is served at `https://wiki.playquorum.dev`.

The wiki is a Foldkit app that Foldkit prerenders at build time (`ssr.build.prerender`). Every page
is a static HTML file that the client then hydrates, so pages load fast, search engines read them,
and live islands still run. `Cloudflare.Website.Foldkit` in `alchemy.run.ts` deploys it from
Foldkit's build manifest; the wiki has no API and no custom Worker.

Content comes from two places:

- **Numbers, unlocks, and lists** come from `@quorum/simulation`'s catalog at build time, as the
  Path of Exile wiki exports its data from the game files. A writer never types a stat, so the wiki
  cannot disagree with the game. Each page shows the `SIM_VERSION` it matches.
- **Prose** is Markdown in `apps/wiki/content`, compiled by `@foldkit/markdown`. Directives such as
  `::TradeoffCard{component="lb"}` place real game views in the text. An unknown island or
  attribute fails the build.

The GDD stays the design document for developers. It holds balance targets and open questions that
players must not read as facts. The wiki rewrites it for players.

Considered options:

- **Pages inside `apps/web`.** One deploy, but the game's bundle, Pixi board, and client-side
  routing would load for every reader, and the pages would not be static HTML. Rejected.
- **A hosted wiki (MediaWiki, wiki.gg, Fandom).** Familiar editing, but no real game views, and
  stats copied by hand drift from the catalog. Rejected.
- **Publish the GDD as is.** No extra writing, but it mixes targets, roadmap, and rules, and it is
  written for developers. Rejected; the wiki links to it for maintainers.

## Consequences

- Decisions taken with the plan: all content is visible by default and an Era filter folds later
  Eras; English only at launch, with routes ready for a locale prefix; community edits arrive as
  pull requests on `apps/wiki/content`; the mini-board replays a guided Sandbox and cannot be
  edited.
- Tests in `apps/wiki` fail when a catalog id has no page, an internal link has no target, or the
  version history has no entry for the current `SIM_VERSION`.
- The wiki depends on `@quorum/simulation` and `@quorum/ui` ([ADR 0010](./0010-ui-package.md)),
  never on `apps/web` or `packages/rpc`.
- What would change it: a need for reader accounts or comments, which would need an API.
