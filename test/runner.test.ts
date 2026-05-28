import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { run, type RunnerEnv } from "../src/runner.js";
import type { ProbeResult, SuiteSlug, DocumentResult } from "../src/probe/probe.js";

const here = fileURLToPath(new URL(".", import.meta.url));

const ALL_SLUGS: SuiteSlug[] = [
  "aeo",
  "agents",
  "prompts",
  "evidence",
  "toolCards",
  "tutorCards",
  "studentAI",
  "classroomAUP",
  "clinicalAI",
  "incidents",
  "decisions"
];

function fakeProbe(score: number, opts?: { tier?: ProbeResult["tier"]; publishedCount?: number }): ProbeResult {
  const publishedCount = opts?.publishedCount ?? Math.round((score / 100) * 11);
  const published: SuiteSlug[] = ALL_SLUGS.slice(0, publishedCount);
  const missing: SuiteSlug[] = ALL_SLUGS.slice(publishedCount);
  const documents = ALL_SLUGS.reduce(
    (acc, slug) => {
      const found = published.includes(slug);
      acc[slug] = found
        ? ({ status: 200, found: true, url: `https://example.com/.well-known/${slug}.json` } as DocumentResult)
        : ({ status: 404, found: false, url: `https://example.com/.well-known/${slug}.json` } as DocumentResult);
      return acc;
    },
    {} as Record<SuiteSlug, DocumentResult>
  );
  return {
    domain: "example.com",
    probedAt: new Date().toISOString(),
    score,
    tier: opts?.tier ?? (score >= 90 ? "comprehensive" : score >= 60 ? "strong" : score >= 30 ? "partial" : score >= 1 ? "minimal" : "none"),
    documents,
    published,
    missing
  };
}

function makeEnv(opts: {
  domain?: string;
  probe?: ProbeResult;
  isPullRequest?: boolean;
  hasToken?: boolean;
  minScore?: string;
  minTier?: string;
  outputPath?: string;
  badgeOutput?: string;
  owner?: string;
}): RunnerEnv {
  const inputs: Record<string, string | undefined> = {
    domain: opts.domain ?? "example.com",
    comment_on_pr: "false"
  };
  if (opts.minScore !== undefined) inputs.min_score = opts.minScore;
  if (opts.minTier !== undefined) inputs.min_tier = opts.minTier;
  if (opts.outputPath !== undefined) inputs.output_path = opts.outputPath;
  if (opts.badgeOutput !== undefined) inputs.badge_output = opts.badgeOutput;
  if (opts.hasToken) inputs.github_token = "ghs_test";

  const writes: Array<{ path: string; content: string }> = [];
  const env: RunnerEnv = {
    inputs,
    probe: async () => opts.probe ?? fakeProbe(0),
    readFile: () => "{}",
    writeFile: (p, c) => { writes.push({ path: p, content: c }); },
    write: () => undefined
  };
  if (opts.owner) env.GITHUB_REPOSITORY_OWNER = opts.owner;
  (env as RunnerEnv & { __writes: typeof writes }).__writes = writes;

  if (opts.isPullRequest) {
    env.GITHUB_EVENT_NAME = "pull_request";
    env.GITHUB_REPOSITORY = "x/y";
    env.GITHUB_EVENT_PATH = `${here}/event.json`;
    env.readFile = (p) => {
      if (p.endsWith("event.json")) return JSON.stringify({ number: 42, pull_request: { number: 42, base: { sha: "abc123" } } });
      return "{}";
    };
  }
  return env;
}

describe("runner.run", () => {
  it("probes the domain and reports score + tier", async () => {
    const r = await run(makeEnv({ probe: fakeProbe(100) }));
    expect(r.exitCode).toBe(0);
    expect(r.probe?.score).toBe(100);
    expect(r.probe?.tier).toBe("comprehensive");
    expect(r.probe?.published).toHaveLength(11);
  });

  it("rejects when domain input is missing", async () => {
    await expect(run({ inputs: {} })).rejects.toThrow(/domain/);
  });

  it("resolves domain='auto' from GITHUB_REPOSITORY_OWNER", async () => {
    let probedDomain = "";
    const env = makeEnv({ domain: "auto", owner: "acme-inc", probe: fakeProbe(50) });
    env.probe = async (d) => { probedDomain = d; return fakeProbe(50); };
    await run(env);
    expect(probedDomain).toBe("acme-inc.github.io");
  });

  it("rejects auto when no owner is set", async () => {
    await expect(run({
      inputs: { domain: "auto", comment_on_pr: "false" },
      probe: async () => fakeProbe(0),
      readFile: () => "{}",
      writeFile: () => undefined,
      write: () => undefined
    })).rejects.toThrow(/GITHUB_REPOSITORY_OWNER/);
  });

  it("fails when score is below min-score gate", async () => {
    const r = await run(makeEnv({ probe: fakeProbe(45), minScore: "75" }));
    expect(r.exitCode).toBe(1);
  });

  it("passes when score meets min-score", async () => {
    const r = await run(makeEnv({ probe: fakeProbe(75), minScore: "75" }));
    expect(r.exitCode).toBe(0);
  });

  it("fails when tier is below min-tier gate", async () => {
    const r = await run(makeEnv({ probe: fakeProbe(20, { tier: "minimal" }), minTier: "strong" }));
    expect(r.exitCode).toBe(1);
  });

  it("rejects bogus min-tier values", async () => {
    await expect(run({
      inputs: { domain: "x.com", min_tier: "godlike" },
      probe: async () => fakeProbe(0),
      readFile: () => "{}",
      writeFile: () => undefined,
      write: () => undefined
    })).rejects.toThrow(/min-tier/);
  });

  it("writes output-path with full probe JSON when provided", async () => {
    const env = makeEnv({ probe: fakeProbe(73), outputPath: "docs/pulse-receipt.json" });
    await run(env);
    const writes = (env as RunnerEnv & { __writes: Array<{ path: string; content: string }> }).__writes;
    const receipt = writes.find((w) => w.path === "docs/pulse-receipt.json");
    expect(receipt).toBeDefined();
    const parsed = JSON.parse(receipt!.content);
    expect(parsed.score).toBe(73);
    expect(parsed.tier).toBe("strong");
  });

  it("writes badge SVG when badge-output is provided", async () => {
    const env = makeEnv({ probe: fakeProbe(91), badgeOutput: "docs/badge.svg" });
    await run(env);
    const writes = (env as RunnerEnv & { __writes: Array<{ path: string; content: string }> }).__writes;
    const badge = writes.find((w) => w.path === "docs/badge.svg");
    expect(badge).toBeDefined();
    expect(badge!.content).toContain("<svg");
    expect(badge!.content).toContain("91/100");
  });

  it("posts a PR comment in pull_request context", async () => {
    const calls: Array<{ body: string }> = [];
    const env = makeEnv({ probe: fakeProbe(50), isPullRequest: true, hasToken: true });
    env.inputs.comment_on_pr = "auto";
    env.postComment = async (args) => { calls.push({ body: args.body }); };
    const r = await run(env);
    expect(r.commentPosted).toBe(true);
    expect(calls[0].body).toContain("Procurement Pulse");
  });

  it("skips PR comment when token is missing", async () => {
    const env = makeEnv({ probe: fakeProbe(50), isPullRequest: true });
    env.inputs.comment_on_pr = "true";
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no github-token provided");
  });

  it("does not comment on non-PR events with comment_on_pr=auto", async () => {
    const env = makeEnv({ probe: fakeProbe(50) });
    env.GITHUB_EVENT_NAME = "push";
    env.inputs.comment_on_pr = "auto";
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
  });

  it("rejects out-of-range timeout-ms", async () => {
    await expect(run({
      inputs: { domain: "x.com", timeout_ms: "99999" },
      probe: async () => fakeProbe(0),
      readFile: () => "{}",
      writeFile: () => undefined,
      write: () => undefined
    })).rejects.toThrow(/out of range/);
  });
});
