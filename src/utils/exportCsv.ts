// utils/exportCsv.ts
import type { Tx } from "../types/tx";
import { useDicts } from "../store/dicts";
import { useAccountsStore } from "../store/accounts";

const esc = (v: any) => {
    const s = String(v ?? "");
    const need = /[",;\n]/.test(s);
    const q = s.replace(/"/g, '""');
    return need ? `"${q}"` : q;
};

function resolveGruppeName(id?: string | null): string {
    if (!id) return "";
    try {
        const { gruppen } = useDicts.getState();
        const hit = Array.isArray(gruppen) ? gruppen.find(g => g.id === id) : undefined;
        return hit?.name ?? id;
    } catch { return id; }
}

function resolveKategorieName(groupId?: string | null, katId?: string | null): string {
    if (!groupId || !katId) return "";
    try {
        const { kategorien } = useDicts.getState();
        const arr = kategorien?.[groupId];
        if (!Array.isArray(arr)) return katId;
        const hit = arr.find(k => k.id === katId);
        return hit?.name ?? katId;
    } catch { return katId ?? ""; }
}

function resolveAnbieterName(id?: string | null): string {
    if (!id) return "";
    try {
        const { anbieter } = useDicts.getState();
        const hit = Array.isArray(anbieter) ? anbieter.find(a => a.id === id) : undefined;
        return hit?.name ?? id;
    } catch { return id; }
}

function resolveKontoName(id?: string | null): string {
    if (!id) return "";
    try {
        const { accounts } = useAccountsStore.getState();
        const hit = accounts.find(a => a.id === id);
        return hit?.name ?? id;
    } catch { return id; }
}

export function toCSV(rows: Tx[]): string {
    const header = [
        "id", "kind", "date", "amount",
        "gruppeId", "gruppe",
        "kategorieId", "kategorie",
        "anbieterId", "anbieter",
        "incomeType", "quelleName", "quelleId",
        "remark", "kontoId", "konto", "repeat",
    ];
    const lines = [header.join(";")];

    for (const r of rows) {
        lines.push([
            esc(r.id),
            esc(r.kind),
            esc(r.date),
            esc(r.amount),
            esc(r.gruppeId),
            esc(resolveGruppeName(r.gruppeId)),
            esc(r.kategorieId),
            esc(resolveKategorieName(r.gruppeId, r.kategorieId)),
            esc(r.anbieterId),
            esc(resolveAnbieterName(r.anbieterId)),
            esc(r.incomeType),
            esc(r.quelleName),
            esc(r.quelleId),
            esc(r.remark),
            esc(r.kontoId),
            esc(resolveKontoName(r.kontoId)),
            esc(r.repeat),
        ].join(";"));
    }

    return lines.join("\n");
}

export function download(filename: string, content: string, mime = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}