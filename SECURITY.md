# Security Policy

`procurement-pulse-action` issues GET requests to the public `/.well-known/` endpoints of the domain it's asked to probe, optionally writes a JSON receipt + SVG badge to paths in the workflow's checkout, and optionally posts a single PR comment via the GitHub API. No remote fetch beyond the probe and the GitHub comment call. No execution of user-supplied code.

The probed domain may be your own or any third party. The probe only reads public well-known paths; it does not authenticate, follow non-well-known links, or scrape page content.

The action uses `${{ github.token }}` by default — scoped to the repo where the workflow runs and never persisted. If you provide your own token via `github-token`, scope it to `pull-requests: write` (plus `contents: write` if you use the auto-sync workflow that commits the pulse receipt + badge back to the repo).

JSON parsing uses `JSON.parse` without `eval` or `Function()`. Probe results are validated discriminator-aware — a 200 of the wrong JSON shape is NOT counted as a published spec, eliminating the most common false-positive failure mode.

The vendored probe library is `well-known-probe-js` under `src/probe/`. To update the probe rules, the action must be rebuilt and republished — supply chain stays explicit.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/procurement-pulse-action/security/advisories/new)

Do not file public issues for security reports.
