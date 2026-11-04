# Companies are named files

A player keeps any number of Companies. Each one has a name and a logo, and the title screen lists
them. The browser stores one Game per Company, behind an index that carries the few figures the
title screen needs.

Before this, the browser held one Company under `quorum.save.v2`. Starting another Company
overwrote the first, and the founding settings were the Founder's "next Company" fields rather than
a property of the Company that started. The GDD asked for three save slots ([Interface and game
feel](../gdd/15-ui-ux.md#save)); a fixed number is a limit with no engineering purpose, so the
index has no cap.

## Decision

1. The player names a Company and picks its logo before founding it. The name and logo belong to
   the Company file, not to the Founder and not to the Game: the Simulation never reads them.
2. `quorum.saves.v1` holds the index: `current`, and one entry per Company with its id, name, logo,
   Venture, Mutators, timestamps, and the Era, Users, and time the title screen lists.
3. One Game lives under `quorum.save.v3.<id>`, with the Company's disclosure and Dashboard history.
   An autosave writes that Company and the index, never another Company.
4. `apps/web` owns the index, the logos, and the founding draft. `packages/simulation` keeps the
   Game, the Founding, and the Venture and Mutator rules; a Company's name reaches the history row
   at Exit, because that row records the Company ([Exit and Legacy](../gdd/13-prestige.md#company-history)).
5. The old `quorum.save.v2` is read once. If it decodes, it becomes the first Company file named
   "Recovered company", and the old key is left in place. If the player already has a Company list,
   the old save is not imported automatically: Settings offers "Recover previous save", a hidden,
   transitional action that adds it to the list. If the old save does not decode, it is kept aside as
   before and the recovery action says so.
6. Exiting a Company deletes its file: an exited Company cannot be continued. Its history row and
   Legacy stay with the Founder.

## Consequences

- Loading a Company is explicit: the index loads the current Company in the background for Continue,
  and the Companies page opens any other file. A Company is never resumed from a stale in-memory
  board when its file says otherwise.
- The index duplicates the Venture and Mutators so the Companies page never decodes every Game.
  `founding` in the Game stays the source of truth; the index is a cache for the list.
- The old single save is never deleted. A player can open an older build and continue that save, and
  the hidden recovery action reads the same key. The action is transitional: after the migration
  window, it can be removed with no change to the index or the Game.
- Export and import of a Company as text ([Interface and game feel](../gdd/15-ui-ux.md#save)) is not
  built. The file boundary makes it a serialization of one Game plus its metadata, not a new format.
