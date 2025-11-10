// utils/exportCsv.ts
// utils/csv.ts
import type { Tx } from "../types/tx";
import { readKontoMap } from "./lookups";
// Zustand store hook exposes getState() for non-React usage
import { useDicts } from "../store/dicts";

/** Escape text for semicolon-delimited CSV cells. */
const esc = (v: any) => {
    const s = String(v ?? "");
    const need = /[",;\n]/.test(s);
    const q = s.replace(/"/g, '""');
    return need ? `"${q}"` : q;
};

/** Resolve group name from Zustand store (Gruppe[]). */
function resolveGruppeName(id?: string | null): string {
    if (!id) return "";
    try {
        const { gruppen } = useDicts.getState();
        const hit = Array.isArray(gruppen) ? gruppen.find(g => g.id === id) : undefined;
        return hit?.name ?? id;
    } catch {
        return id;
    }
}

/** Resolve category name using KategorienByGroup (Record<groupId, Kategorie[]>). */
function resolveKategorieName(groupId?: string | null, katId?: string | null): string {
    if (!groupId || !katId) return "";
    try {
        const { kategorien } = useDicts.getState();
        const arr = kategorien?.[groupId];
        if (!Array.isArray(arr)) return katId;
        const hit = arr.find(k => k.id === katId);
        return hit?.name ?? katId;
    } catch {
        return katId ?? "";
    }
}

/** Resolve supplier name from Zustand store (Anbieter[]). */
function resolveAnbieterName(id?: string | null): string {
    if (!id) return "";
    try {
        const { anbieter } = useDicts.getState();
        const hit = Array.isArray(anbieter) ? anbieter.find(a => a.id === id) : undefined;
        return hit?.name ?? id;
    } catch {
        return id;
    }
}

/** Export transactions to CSV (semicolon-separated).
 *  Adds human-readable columns next to IDs:
 *   - gruppe (from gruppen[] by id)
 *   - kategorie (from kategorien[groupId][] by id)
 *   - anbieter (from anbieter[] by id)
 *  Best practices: robust fallbacks, no throws, stable header.
 */
export function toCSV(rows: Tx[], kontoMap = readKontoMap()): string {
    const header = [
        "id",
        "kind",
        "date",
        "amount",
        "gruppeId",
        "gruppe",        // human-readable
        "kategorieId",
        "kategorie",     // human-readable
        "anbieterId",
        "anbieter",      // human-readable
        "incomeType",
        "quelleName",    // human-readable
        "quelleId",
        "remark",
        "kontoId",
        "konto",         // human-readable
        "repeat",
    ];
    const lines = [header.join(";")];

    for (const r of rows) {
        const kontoName = r.kontoId ? (kontoMap.get(String(r.kontoId)) ?? "") : "";

        const gruppeName = resolveGruppeName(r.gruppeId ?? "");
        const kategorieName = resolveKategorieName(r.gruppeId ?? "", r.kategorieId ?? "");
        const anbieterName = resolveAnbieterName(r.anbieterId ?? "");

        lines.push(
            [
                esc(r.id),
                esc(r.kind),
                esc(r.date),
                esc(r.amount),
                esc(r.gruppeId),
                esc(gruppeName),
                esc(r.kategorieId),
                esc(kategorieName),
                esc(r.anbieterId),
                esc(anbieterName),
                esc(r.incomeType),
                esc(r.quelleName),
                esc(r.quelleId),
                esc(r.remark),
                esc(r.kontoId),
                esc(kontoName),
                esc(r.repeat),
            ].join(";")
        );
    }

    return lines.join("\n");
}

/** Trigger a browser download for generated content. */
export function download(filename: string, content: string, mime = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
