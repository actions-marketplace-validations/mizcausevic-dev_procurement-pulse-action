# procurement-pulse-action

[![CI](https://github.com/mizcausevic-dev/procurement-pulse-action/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/procurement-pulse-action/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

GitHub Action that **probes your own domain's `/.well-known/` paths** for all 11 [Kinetic Gain Protocol Suite](https://suite.kineticgain.com/) documents and reports a 0–100 disclosure score + tier.

Use it to:
- **Self-score on every PR.** Catch a regression that drops your score before merge.
- **Gate releases.** Fail the build if score falls below a threshold (`min-score: 75`) or tier drops below `strong`.
- **Publish a self-score SVG badge.** Embed in your README. Auto-refresh whenever a PR touches `/.well-known/`.
- **Commit a `pulse-receipt.json`.** A timestamped, machine-readable record of your most recent self-score.

The probe is the same one [pulse.kineticgain.com](https://pulse.kineticgain.com/) uses to crawl the Issue universe. If you're a vendor measured by the Pulse, this Action lets you measure yourself against the same scoring before the next issue.

Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Usage

### Minimum — score the action's own repo's `*.github.io` and post on PR

```yaml
name: Pulse self-score
on:
  pull_request:
    paths: ["public/.well-known/**", ".well-known/**"]

jobs:
  pulse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/procurement-pulse-action@v0.1-shipped
        with:
          domain: auto      # derived from <owner>.github.io
```

### Gate the release — fail below threshold

```yaml
- uses: mizcausevic-dev/procurement-pulse-action@v0.1-shipped
  with:
    domain: example.com
    min-score: 75
    min-tier: strong
```

### Auto-sync the badge SVG + pulse receipt

```yaml
permissions:
  contents: write
on:
  push:
    branches: [main]
    paths: [".well-known/**"]

jobs:
  refresh-pulse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/procurement-pulse-action@v0.1-shipped
        with:
          domain: example.com
          output-path: public/.well-known/pulse-receipt.json
          badge-output: docs/pulse-badge.svg
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add public/.well-known/pulse-receipt.json docs/pulse-badge.svg
          git diff --staged --quiet || git commit -m "chore(pulse): refresh self-score"
          git push
```

Then embed in your README:

```markdown
![Pulse self-score](./docs/pulse-badge.svg)
```

## Inputs

| input            | required | default     | description |
|---|---|---|---|
| `domain`         | ✓        | —           | Domain to probe. `auto` resolves to `<owner>.github.io`. |
| `min-score`      |          | `0`         | Fail if score is below this 0–100 threshold. |
| `min-tier`       |          | `none`      | Fail if tier is below this. Order: `none < minimal < partial < strong < comprehensive`. |
| `timeout-ms`     |          | `5000`      | Per-fetch timeout (clamped to 100–60000). |
| `comment-on-pr`  |          | `auto`      | `auto` posts only on `pull_request` events. |
| `output-path`    |          | —           | If set, write the full ProbeResult JSON here (commit it back to publish a pulse receipt). |
| `badge-output`   |          | —           | If set, write a self-score SVG badge here. |
| `github-token`   |          | `${{ github.token }}` | Token for posting the PR comment. |

## Outputs

| output            | description |
|---|---|
| `score`           | 0–100 disclosure score. |
| `tier`            | `comprehensive` / `strong` / `partial` / `minimal` / `none`. |
| `published-count` | Number of Suite documents the domain publishes. |
| `missing-count`   | Number of Suite documents the domain is missing. |
| `published`       | Comma-separated slugs of documents found. |
| `missing`         | Comma-separated slugs of documents missing. |

## What it probes

Every probe checks all 11 canonical Suite paths, with discriminator-aware validation (a 200 of the wrong JSON shape does NOT count as published):

`aeo` · `agents` · `prompts` · `evidence` · `toolCards` · `tutorCards` · `studentAI` · `classroomAUP` · `clinicalAI` · `incidents` · `decisions`

The probe library is [`well-known-probe-js`](https://github.com/mizcausevic-dev/well-known-probe-js), vendored under `src/probe/` for a self-contained Action build (no runtime `npm install`).

## How it composes

- Pair with [`agent-card-diff-action`](https://github.com/mizcausevic-dev/agent-card-diff-action) (and siblings) — they gate **breaking changes** in individual docs; this Action gates the **publication score** across all 11.
- Pair with [`kg-suite-pr-gate-action`](https://github.com/mizcausevic-dev/kg-suite-pr-gate-action) — that one auto-routes changed docs to per-protocol diffs; this one independently scores your `/.well-known/` surface.
- Pair with the [Vendor AI Disclosure Inspector](https://github.com/mizcausevic-dev/kineticgain-vendor-inspector) — same probe core, but in a browser extension instead of CI.

## License

[AGPL-3.0-or-later](LICENSE)
