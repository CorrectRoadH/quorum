# Mail is client state, derived from the Simulation

The game speaks to the player through Mail: advice, offers, and reports in an Inbox that works like
an email app ([GDD 18](../gdd/18-mail.md)). Mail lives in the web app's `Model` (`inbox`), not in the
Simulation.

The Simulation decides when something is worth saying and emits it as a **fact** (`nextGoal` today;
the open funding round, a finished task, a CVE). The web app turns each new fact into one Mail
and stores it. A fact that changes the game, such as a CVE and its exploit clock or a rewrite
proposal, is Simulation state, and its answer is an Action; the Mail text, Sender, colour, spam,
and phishing copy stay in the web app. An action button
sends the same Message that the panel it replaces sends, so the Simulation sees the same Action as
before. Replays, Challenges, and the server's check
([ADR 0004](./0004-simulation-package.md)) never see Mail.

Considered options:

- **Mail in `Game`.** The Inbox would be saved, replayed, and checked by the server for free. But
  Mail is presentation, it would grow every save, and a copy change would change a replay. Rejected.
- **Keep goals, offers, and cards as separate UI and add an Inbox that only logs them.** No new
  contract, but the player must still deal with banners and modals, which is the problem. Rejected.

## Consequences

- Copy for Mail lives in the web app or in the Simulation's text helpers, like `nextGoal`.
- The Inbox is not saved yet. Saving it means an optional `inbox` field in the Company save, capped
  at 40 Mail.
- A CVE is a patch ticket in the backlog (`WorkItem` with a `due`), disclosed on a fixed interval from the
  Company's seed. Its overdue state and the Data breach it causes are Simulation state, so replays and
  the server's check see them ([SIM_VERSION](../../packages/simulation/src/version.ts) 11). Only the
  advisory text, the Needs action / FYI split, and the pause setting are web state.
- Sandboxes and Challenges send no Mail.
- What would change it: a need for the server to know what the player read, such as a daily drill
  that scores on advice taken.
