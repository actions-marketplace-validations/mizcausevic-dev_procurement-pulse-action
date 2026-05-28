// Type declarations co-located with the vendored probe.js. The runtime
// continues to load the JS file directly; this just teaches the TS compiler
// the shape so the action's runner.ts can type-check imports from
// `./probe/probe.js`.

export interface SpecPath {
  readonly url: string;
  readonly discriminator: string | null;
}

export const SUITE_PATHS: Readonly<{
  aeo: SpecPath;
  agents: SpecPath;
  prompts: SpecPath;
  evidence: SpecPath;
  toolCards: SpecPath;
  tutorCards: SpecPath;
  studentAI: SpecPath;
  classroomAUP: SpecPath;
  clinicalAI: SpecPath;
  incidents: SpecPath;
  decisions: SpecPath;
}>;

export type SuiteSlug = keyof typeof SUITE_PATHS;
export type Tier = "comprehensive" | "strong" | "partial" | "minimal" | "none";

export interface ProbeOptions {
  timeout?: number;
  signal?: AbortSignal;
  fetch?: typeof fetch;
  scheme?: "http" | "https";
}

export interface DocumentResult {
  status: number;
  found: boolean;
  url?: string;
  json?: unknown;
  version?: string;
  error?: string;
}

export interface ProbeResult {
  domain: string;
  probedAt: string;
  score: number;
  tier: Tier;
  documents: Record<SuiteSlug, DocumentResult>;
  published: SuiteSlug[];
  missing: SuiteSlug[];
}

export function probeWellKnown(domain: string, options?: ProbeOptions): Promise<ProbeResult>;
