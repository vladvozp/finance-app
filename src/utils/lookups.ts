// src/utils/lookups.ts
export type Konto = { id: string; name: string };

const ACC_KEY = "ft_accounts_v1";

export function readKontoMap(): Map<string, string> {
    try {
        const raw = localStorage.getItem(ACC_KEY);
        const arr = raw ? (JSON.parse(raw) as Konto[]) : [];
        const map = new Map<string, string>();
        for (const k of arr) if (k?.id) map.set(k.id, k.name ?? k.id);
        return map;
    } catch {
        return new Map();
    }
}
