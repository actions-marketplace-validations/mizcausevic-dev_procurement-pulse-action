/**
 * @typedef {Object} ProbeOptions
 * @property {number} [timeout=5000]   Per-fetch timeout in milliseconds.
 * @property {AbortSignal} [signal]    External AbortSignal to cancel the probe.
 * @property {typeof fetch} [fetch]    Custom fetch implementation (for tests / instrumentation).
 * @property {string} [scheme='https'] URL scheme. Default https; pass 'http' for localhost testing.
 */
/**
 * @typedef {Object} DocumentResult
 * @property {number} status      HTTP status code (0 if the request failed before a response).
 * @property {boolean} found      True if status=200 AND content is a valid JSON object (and matches discriminator if any).
 * @property {string} [url]       The exact URL probed.
 * @property {object} [json]      The parsed JSON payload (only present if found).
 * @property {string} [version]   The value of the discriminator field, if it was checked.
 * @property {string} [error]     Error message if the probe failed.
 */
/**
 * @typedef {Object} ProbeResult
 * @property {string} domain
 * @property {string} probedAt    ISO-8601 timestamp of when the probe started.
 * @property {number} score       0-100, fraction of the 11 Suite documents found.
 * @property {string} tier        'comprehensive' | 'strong' | 'partial' | 'minimal' | 'none'
 * @property {Record<string, DocumentResult>} documents  One entry per SUITE_PATHS key.
 * @property {string[]} published Slugs of documents that were found.
 * @property {string[]} missing   Slugs of documents that were NOT found.
 */
/**
 * Probe a single domain for every Suite document.
 *
 * @param {string} domain        Domain (with or without scheme). e.g. 'kineticgain.com' or 'https://kineticgain.com'.
 * @param {ProbeOptions} [options]
 * @returns {Promise<ProbeResult>}
 */
export function probeWellKnown(domain: string, options?: ProbeOptions): Promise<ProbeResult>;
/**
 * The eleven canonical Suite paths. Each entry maps a spec slug to its
 * well-known URL (relative to the origin). For `agents` / `tools` / `decisions`
 * / `incidents` / `prompts` / `evidence` / `tutor-cards` / `student-ai` /
 * `clinical-ai` we probe the index.json that publishers use to enumerate the
 * documents in that family.
 *
 * Discriminator fields (the `<thing>_version` keys) confirm we actually
 * received the document we expected — a 200 with the wrong JSON shape is
 * NOT counted as a published spec.
 */
export const SUITE_PATHS: Readonly<{
    aeo: {
        url: string;
        discriminator: string;
    };
    agents: {
        url: string;
        discriminator: null;
    };
    prompts: {
        url: string;
        discriminator: null;
    };
    evidence: {
        url: string;
        discriminator: null;
    };
    toolCards: {
        url: string;
        discriminator: null;
    };
    tutorCards: {
        url: string;
        discriminator: null;
    };
    studentAI: {
        url: string;
        discriminator: null;
    };
    classroomAUP: {
        url: string;
        discriminator: string;
    };
    clinicalAI: {
        url: string;
        discriminator: null;
    };
    incidents: {
        url: string;
        discriminator: null;
    };
    decisions: {
        url: string;
        discriminator: null;
    };
}>;
export type ProbeOptions = {
    /**
     * Per-fetch timeout in milliseconds.
     */
    timeout?: number | undefined;
    /**
     * External AbortSignal to cancel the probe.
     */
    signal?: AbortSignal | undefined;
    /**
     * Custom fetch implementation (for tests / instrumentation).
     */
    fetch?: typeof fetch | undefined;
    /**
     * URL scheme. Default https; pass 'http' for localhost testing.
     */
    scheme?: string | undefined;
};
export type DocumentResult = {
    /**
     * HTTP status code (0 if the request failed before a response).
     */
    status: number;
    /**
     * True if status=200 AND content is a valid JSON object (and matches discriminator if any).
     */
    found: boolean;
    /**
     * The exact URL probed.
     */
    url?: string | undefined;
    /**
     * The parsed JSON payload (only present if found).
     */
    json?: object | undefined;
    /**
     * The value of the discriminator field, if it was checked.
     */
    version?: string | undefined;
    /**
     * Error message if the probe failed.
     */
    error?: string | undefined;
};
export type ProbeResult = {
    domain: string;
    /**
     * ISO-8601 timestamp of when the probe started.
     */
    probedAt: string;
    /**
     * 0-100, fraction of the 11 Suite documents found.
     */
    score: number;
    /**
     * 'comprehensive' | 'strong' | 'partial' | 'minimal' | 'none'
     */
    tier: string;
    /**
     * One entry per SUITE_PATHS key.
     */
    documents: Record<string, DocumentResult>;
    /**
     * Slugs of documents that were found.
     */
    published: string[];
    /**
     * Slugs of documents that were NOT found.
     */
    missing: string[];
};
