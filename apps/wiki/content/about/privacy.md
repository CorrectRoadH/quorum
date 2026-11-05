---
title: Privacy
summary: What Quorum records, what it does not, who processes it, and how to turn it off.
section: about
order: 2
aliases: privacy policy, data, analytics, tracking, opt out, gdpr
---

Quorum records anonymous usage data to improve the game. This page lists what is recorded, what is
not, and how to turn it off.

## What is recorded

When you play, the game sends events to PostHog, our analytics processor:

- A session starts and ends, with how long it lasted and how much of that time the game was active.
- A sample of the Company every two minutes while the game is open: Era, Users, Cash, revenue, Burn,
  Apdex, error share, the Bottleneck, Node and Link counts, speed, team size, and the number of open
  regions.
- A Company is founded, reaches an Era, or exits, with its Venture, Mutators, and the figures at that
  moment.
- A Node is placed, a Link is created, a Research item completes, or an action is refused, with the
  Component, the Era, and the reason.
- The page you opened, the site that referred you, and any UTM parameters in the link.
- Your interface language, viewport size, whether Agent access is on, and whether the game runs as an
  installed app.
- A random device ID, stored in your browser, so a return visit counts as the same player.
- A crash report if the game throws an error: the error and its stack trace.
- Performance data: how long some actions take (saving, loading, a simulation step, a request to the
  server), how long the page takes to load, and a sample of function-level profiles in some Chromium
  browsers. An error report also carries the kind of screen, the Era, and the version of the game's
  rules. It never carries your Company or its name.
- On the wiki, the page you read and the site that referred you.

PostHog derives an approximate country from your IP address. The game does not send your IP address
itself.

## What is not recorded

- Your name, email address, or any account information. Quorum has no accounts.
- The name you give a Company.
- Session recordings, keystrokes, clipboard contents, or the contents of any text field.
- Advertising identifiers. Nothing is sold to anyone.

## Why

The data answers four questions: how many people play, where new players stop, how players build and
progress, and whether the client is healthy. We use it to tune pacing, difficulty, and onboarding. We
do not use it for advertising.

## Who processes it

- **PostHog** (US Cloud) stores the events in the United States. See
  [PostHog's privacy policy](https://posthog.com/privacy).
- **Sentry** stores crash reports and performance data. See
  [Sentry's privacy policy](https://sentry.io/privacy/).
- **Cloudflare** serves the game and forwards analytics requests. See
  [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/).

## How long

PostHog keeps events for one year on the free plan. Sentry keeps errors and performance data for 90
days.

## Turn it off

1. Open **Settings** in the game.
2. Turn off **Share anonymous usage data**.

The game stops sending events, crash reports, and performance data immediately and remembers the choice in your browser. It also respects
your browser's Do Not Track setting. Clearing your browser storage removes the device ID and the
stored choice.

Turning analytics off does not affect the game. Every feature works the same.

## Contact

Open an issue at [github.com/elianiva/quorum](https://github.com/elianiva/quorum/issues).

## Changes

This page changes when the data changes. The date below is the last change.

Last updated: 5 November 2026.
