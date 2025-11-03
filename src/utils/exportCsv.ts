
import type { Tx } from "../types/tx";

export function toCSV(rows: Tx[]): string {
    const esc = (v: any) => {
        const s = String(v ?? "");
        const need = /[",;\n]/.test(s);
        const q = s.replace(/"/g, '""');
        return need ? `"${q}"` : q;
    };

    const header = ["id", "kind", "date", "amount", "gruppeId", "kategorieId", "anbieterId", "incomeType", "quelleName", "quelleId", "remark", "kontoId", "repeat"];
    const lines = [header.join(";")];
    for (const r of rows) {
        lines.push([
            esc(r.id), esc(r.kind), esc(r.date), esc(r.amount),
            esc(r.gruppeId), esc(r.kategorieId), esc(r.anbieterId),
            esc(r.incomeType), esc(r.quelleName), esc(r.quelleId),
            esc(r.remark), esc(r.kontoId), esc(r.repeat),
        ].join(";"));
    }
    return lines.join("\n");
}


export function download(filename: string, content: string, mime = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}