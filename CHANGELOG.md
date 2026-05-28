# Changelog

## v0.1.0 — 2026-05-27

- Initial release: GitHub Action that probes a domain's `/.well-known/` for all 11 Kinetic Gain Protocol Suite documents and reports a 0–100 disclosure score + tier.
- Inputs: `domain` (required; `auto` resolves to `<owner>.github.io`), `min-score`, `min-tier`, `timeout-ms`, `comment-on-pr`, `output-path`, `badge-output`, `github-token`.
- Outputs: `score`, `tier`, `published-count`, `missing-count`, `published`, `missing`.
- **Three output modes** chainable in any combination:
  1. **PR comment** with per-spec ✅/❌ breakdown
  2. **Pulse receipt** — full `ProbeResult` JSON to `output-path` (commit back as a timestamped self-score record)
  3. **Self-score SVG badge** — Shields.io-style, tier-coloured, self-contained — write to `badge-output` for README embedding
- **Two gate modes** to fail the build: `min-score` (0–100 threshold) and `min-tier` (`comprehensive` > `strong` > `partial` > `minimal` > `none`).
- Vendored `well-known-probe-js` under `src/probe/` for a self-contained Action build — no runtime `npm install`. Same probe core as the Pulse Issue crawler + browser-extension Vendor Inspector.
- 14 tests with injected `probe`/`readFile`/`writeFile` for hermetic execution. Covers score gates, tier gates, auto-domain resolution, badge SVG rendering, receipt writing, PR comment posting, threshold validation.
- Composite Node 20 action with `dist/index.js` committed for SHA/tag pinning.
- Node 20/22 CI (lint, typecheck, coverage, build, `npm audit`), AGPL-3.0-or-later, Dependabot.
- Closes the loop opened by [pulse.kineticgain.com](https://pulse.kineticgain.com/) Issue #2 — "we measure" — now vendors can answer with "we self-score on every PR".
