# Game views live in one UI package

The wiki ([ADR 0009](./0009-the-wiki-is-a-prerendered-app.md)) shows the game's real views: a Node
card, a Tradeoff card, the research tree, and the board. A copy would drift from the game, and an
app cannot import another app. The views move to `packages/ui` (`@quorum/ui`), which both apps
import.

The package has subpath exports:

- `@quorum/ui/primitives/*`: buttons, cards, tabs, and the other design-system parts. They import
  only Foldkit, `@foldkit/ui`, `cn`, and `lucide`.
- `@quorum/ui/game/*`: game views over Simulation data, number formats, and icons. A view takes the
  data it shows and the Messages it sends, never an app's Model.
- `@quorum/ui/board`: the Pixi board. It takes a `BoardState` and callbacks, so it does not know
  about sound or the app's Messages.
- `@quorum/ui/theme.css`: the Graphite palette, fonts, and custom variants that both apps import,
  so the wiki and the game share one design language.

Only views that the wiki embeds move. Screens that exist only in the game (the dock, the HUD,
Settings) stay in `apps/web`.

Considered options:

- **Two packages**, one for primitives and one for game views. Cleaner layering, but both have the
  same two consumers, and the repository adds a package only for a real boundary. Rejected;
  subpaths keep the wiki from loading Pixi through a primitives import.
- **Wiki-only copies of the views.** Rejected: they would drift from the game.

## Consequences

- `primitives` never imports `game` or `board`. `game` and `board` import `@quorum/simulation` and
  `primitives`, never an app.
- The package ships TypeScript source, as `@quorum/simulation` does. Each app's Vite build compiles
  it, and Tailwind scans it through an `@source` rule in `theme.css`.
- What would change it: a third consumer with different needs, such as a native client.
