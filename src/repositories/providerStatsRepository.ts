// src/repositories/providerStatsRepository.ts


// ---------- Provider stats (learning: Provider -> Group) ----------
const PROVIDER_STATS_KEY = "ft_provider_stats_v1";

export type ProviderStats = {
    providerCounts: Record<string, number>;
    providerGroupCounts: Record<string, Record<string, number>>;
};

export function loadProviderStats(): ProviderStats {
    try {
        const raw = localStorage.getItem(PROVIDER_STATS_KEY);
        if (!raw) return { providerCounts: {}, providerGroupCounts: {} };
        const parsed = JSON.parse(raw);
        return {
            providerCounts: parsed.providerCounts || {},
            providerGroupCounts: parsed.providerGroupCounts || {},
        };
    } catch {
        return { providerCounts: {}, providerGroupCounts: {} };
    }
}

export function saveProviderStats(stats: ProviderStats): void {
    try {
        localStorage.setItem(PROVIDER_STATS_KEY, JSON.stringify(stats));
    } catch {
        // ignore
    }
}