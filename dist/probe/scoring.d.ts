/**
 * Score + tier helpers. Pulled into a separate module so the scoring rule is
 * easy to reason about (and easy to swap if you want a weighted alternative).
 */
/**
 * Compute a 0-100 score from a fraction of found documents.
 *
 * Linear by default. We resisted the temptation to weight some specs more
 * heavily than others — every Suite spec is a complete vendor disclosure and
 * counting equally is what makes vendors fight to publish them all.
 *
 * @param {{ found: number, total: number }} input
 * @returns {{ score: number, tier: string }}
 */
export function scoreResult({ found, total }: {
    found: number;
    total: number;
}): {
    score: number;
    tier: string;
};
/**
 * Map a score to a tier label. Tiers are chosen so the cutoffs match the
 * Procurement Pulse public report's reporting bands.
 *
 * @param {number} score   0-100
 * @returns {'comprehensive' | 'strong' | 'partial' | 'minimal' | 'none'}
 */
export function tierFromScore(score: number): "comprehensive" | "strong" | "partial" | "minimal" | "none";
