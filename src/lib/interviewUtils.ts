/**
 * Scores interview performance based on transcript text analysis.
 * Uses heuristics for depth, technical keywords, specificity, and structure.
 */
export function scorePerformance(text: string): number {
    const lower = text.toLowerCase();
    const wordCount = text.trim().split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 5).length;

    // Helper: continuous sigmoid centered at `center`, scaled by `slope`
    const sig = (x: number, center: number, slope: number) =>
        Math.tanh((x - center) / slope);

    const depthScore = sig(wordCount, 20, 15);
    const techKeywords = [
        "algorithm", "complexity", "architecture", "scalability", "latency",
        "throughput", "trade-off", "tradeoff", "distributed", "consistency",
        "availability", "partition", "database", "cache", "api", "microservice",
        "kubernetes", "docker", "ci/cd", "pipeline", "deployed", "implemented",
        "optimized", "refactored", "async", "concurrent", "thread", "memory",
        "time complexity", "space complexity", "o(n",
        "race condition", "idempotent", "inconsistency", "ingestion", "validation gates",
        "feature engineering", "scraping", "bottleneck", "deadlock", "idempotency",
        "eventual consistency", "acid", "normalization", "indexing", "sharding",
        "load balancer", "replication", "failover", "consensus", "raft", "paxos"
    ];
    const techHits = techKeywords.filter(k => lower.includes(k)).length;
    const techScore = sig(techHits, 1.2, 1.2);

    const specificityMarkers = [
        "specifically", "for example", "for instance", "such as", "in particular",
        "we used", "i built", "i led", "i reduced", "i increased", "resulted in",
        "percent", "%", "ms", "seconds", "million", "thousand", "users",
        "enforcing", "tackle", "separation", "gate", "logic"
    ];
    const numberHits = (text.match(/\b\d+(\.\d+)?[kmb%]?\b/gi) || []).length;
    const specificityHits = specificityMarkers.filter(m => lower.includes(m)).length + numberHits;
    const specificityScore = sig(specificityHits, 1, 1.0);

    const structureScore = sig(sentenceCount, 1.5, 0.8);

    const fillers = ["um", "uh", "like", "you know", "basically", "kind of", "sort of", "i mean"];
    const fillerCount = fillers.filter(f => lower.includes(f)).length;
    const fillerDensity = fillerCount / Math.max(1, wordCount / 10);
    const fillerPenalty = Math.tanh(fillerDensity * 2.5);

    const raw = (
        depthScore * 0.25 +
        techScore * 0.45 +      // Increased weight for technical depth
        specificityScore * 0.15 +
        structureScore * 0.15
    ) - fillerPenalty * 0.3;

    return Math.max(-1, Math.min(1, raw));
}
