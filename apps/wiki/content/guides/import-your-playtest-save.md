---
title: Import your playtest save
summary: Played Quorum during the playtest? Bring the Company from the old single save into your Companies list, or find out why it cannot be imported.
section: guides
order: 11
aliases: playtest, old save, import, migrate, migration, recover, recover save, company list, alpha, save data
gdd: docs/gdd/15-ui-ux.md
---

:::Note{tone="warn"}
This import is temporary. Quorum removes it when the game leaves alpha. Import a playtest Company
before then if you want to keep it.
:::

The playtest build saved one Company in your browser. This build saves any number of Companies, each
with a name and a logo. The old Company can move into the new Companies list.

## What the import keeps

The imported Company keeps its Design, Cash, Insight, Research, Team, Users, calendar time, and
Dashboard history. The old save has no name or logo, so the Company is called **Recovered company**
and uses the default logo.

The old save stays in your browser. Quorum never deletes it, so nothing is lost if you open an older
build later.

## Import automatically

If the main menu shows **Continue** after you update, the import already happened:

1. Open Quorum and clock in.
2. The main menu shows **Continue** with your playtest Company. Select it.

The Company now has its own file in the **Companies** list. The old save stays where it is.

## Import from Settings

Use this path when the main menu does not show the old Company, for example because you already
started a Company in this build.

1. On the main menu, select **Settings**.
2. Scroll to the bottom of the list.
3. Select **Recover previous save**. Its line marks the action as temporary.
4. Quorum adds **Recovered company** to your Companies and opens it on the board.

If **Recover previous save** is not in the list, Quorum did not find an old save. If Quorum says the
save is already in your Companies, you have already imported it.

## If the import cannot run

| Message                                                       | What it means                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| “The previous save could not be read. It was left untouched.” | This build cannot read the save. Nothing is changed or deleted.       |
| “The previous save is already in your companies.”             | The old save is already imported. Quorum does not make a second copy. |
| “There is no previous save to recover.”                       | The browser has no old single save.                                   |

## What happens to the rest of your playtest data

The Founder record, settings, Sandbox progress, and the playtest log are separate from the Company
save. They stay as they were:

- **Founder**: Legacy, Perks, Playbooks, achievements, and the company history.
- **Settings**: language, sound, motion, pause behavior, and Agent access.
- **Sandbox**: passed guided Sandboxes and the free Sandbox.
- **Playtest log**: the log behind **Export playtest log** on the title screen.

Only the Company moves into the Companies list.

## After the import

- Each Company saves every ten seconds. Starting another Company does not overwrite the first one.
- An Exit closes that Company's file. Its history row and Legacy stay with the Founder.
- Export and import of a Company as text does not exist yet.

When Quorum leaves alpha, this recovery action is deleted. The old save key is not part of the
released save format.
