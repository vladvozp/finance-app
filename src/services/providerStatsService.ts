// src/services/providerStatsService.ts
import type { ProviderStats } from "../repositories/providerStatsRepository";

export function bumpProviderStats(
    stats: ProviderStats,
    providerId: string,
    groupId: string | ""
): ProviderStats {
    if (!providerId) return stats;

    const next: ProviderStats = {
        providerCounts: { ...stats.providerCounts },
        providerGroupCounts: { ...stats.providerGroupCounts },
    };

    next.providerCounts[providerId] = (next.providerCounts[providerId] || 0) + 1;

    if (groupId) {
        const existingGroups = next.providerGroupCounts[providerId] || {};
        next.providerGroupCounts[providerId] = {
            ...existingGroups,
            [groupId]: (existingGroups[groupId] || 0) + 1,
        };
    }

    return next;
}

export function getMostUsedGroupForProvider(
    providerId: string,
    stats: ProviderStats
): string {
    const groups = stats.providerGroupCounts[providerId];
    if (!groups) return "";
    let bestId = "";
    let bestCount = 0;
    for (const [gid, count] of Object.entries(groups)) {
        if (count > bestCount) {
            bestId = gid;
            bestCount = count;
        }
    }
    return bestId;
}