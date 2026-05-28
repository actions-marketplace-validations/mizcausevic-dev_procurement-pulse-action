import type { ProbeResult } from "./probe/probe.js";
export interface RunnerEnv {
    inputs: Record<string, string | undefined>;
    GITHUB_OUTPUT?: string;
    GITHUB_EVENT_NAME?: string;
    GITHUB_REPOSITORY?: string;
    GITHUB_REPOSITORY_OWNER?: string;
    GITHUB_EVENT_PATH?: string;
    /** Inject for tests. Defaults to the vendored probeWellKnown over real network. */
    probe?: (domain: string, options: {
        timeout: number;
    }) => Promise<ProbeResult>;
    readFile?: (path: string) => string;
    writeFile?: (path: string, content: string) => void;
    postComment?: (args: {
        token: string;
        repo: string;
        issueNumber: number;
        body: string;
    }) => Promise<void>;
    write?: (line: string) => void;
}
export interface RunnerResult {
    exitCode: 0 | 1;
    domain: string;
    probe: ProbeResult | null;
    commentPosted: boolean;
    outputWritten: boolean;
    badgeWritten: boolean;
    reason?: string;
}
export declare function run(env: RunnerEnv): Promise<RunnerResult>;
