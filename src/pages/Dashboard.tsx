import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";

/** Domain model for a transaction kept in LocalStorage. */
type Tx = {
    id: string;
    kind: "expense" | "income";
    amount: number;        // expense: negative, income: positive
    date: string | null;   // YYYY-MM-DD or null

    // EXPENSE-only
    gruppeId?: string;
    kategorieId?: string;
    anbieterId?: string | null;

    // INCOME-only
    incomeType?: "GEHALT" | "RENTE" | "MIETE" | "VERKAUF" | "GESCHЕНК" | "SONSTIGES";
    quelleId?: string | null;
    quelleName?: string | null;

    // COMMON
    kontoId?: string | null;
    remark?: string | null;
    repeat?: boolean;
};

const TX_KEY = "ft_transactions";
const SETTINGS_KEY = "ft_dashboard_settings_v1"; // bump version if shape changes

/** Storage helpers — isolate format behind small functions. */
function readTxList(): Tx[] {
    try {
        const raw = localStorage.getItem(TX_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}
function writeTxList(list: Tx[]) {
    localStorage.setItem(TX_KEY, JSON.stringify(list));
}

/** CSV exporter for current view */
function toCSV(rows: Tx[]): string {
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
function download(filename: string, content: string, mime = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

/** Small debounce to avoid spamming LS on every keystroke. */
function debounce<T extends (...a: any) => void>(fn: T, ms = 250) {
    let t: number | undefined;
    // @ts-ignore
    return (...args: any[]) => { if (t) clearTimeout(t); t = window.setTimeout(() => fn(...args), ms); };
}

export default function Dashboard() {
    const [items, setItems] = useState<Tx[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [spinOnce, setSpinOnce] = useState(false);

    /** ---------- SETTINGS STATE (persisted) ---------- */
    const [kindFilter, setKindFilter] = useState<"all" | "income" | "expense">("all");
    const [from, setFrom] = useState<string>(""); // YYYY-MM-DD
    const [to, setTo] = useState<string>(""); // YYYY-MM-DD

    const [cols, setCols] = useState({
        gruppe: true,
        kategorie: true,
        quelle: true,
        incomeType: true,
        remark: false,
        actions: true,
    });

    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });

    /** Load persisted settings once. Backward compatible & safe parsing. */
    useEffect(() => {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return;
            const s = JSON.parse(raw);
            if (s?.kindFilter) setKindFilter(s.kindFilter);
            if (typeof s?.from === "string") setFrom(s.from);
            if (typeof s?.to === "string") setTo(s.to);
            if (s?.cols && typeof s.cols === "object") setCols((c) => ({ ...c, ...s.cols }));
            if (s?.sort && typeof s.sort === "object" && s.sort.key && s.sort.dir) setSort(s.sort);
        } catch { /* ignore */ }
    }, []);

    /** Persist settings on change (debounced). */
    const persistSettings = useRef(
        debounce((payload: any) => {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
        }, 250)
    ).current;

    useEffect(() => {
        persistSettings({ kindFilter, from, to, cols, sort });
    }, [kindFilter, from, to, cols, sort, persistSettings]);

    /** ------------------------------------------------ */

    // Column toggles + sort helpers
    const toggleCol = (k: keyof typeof cols) => setCols((c) => ({ ...c, [k]: !c[k] }));
    const toggleSort = (key: string) =>
        setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

    // One-off gear spin
    const onGearClick = () => {
        if (spinOnce) return;
        setSpinOnce(true);
        setTimeout(() => setSpinOnce(false), 600);
    };

    // Load transactions
    useEffect(() => {
        try {
            const parsed = readTxList();
            setItems(parsed);
            setParseError(null);
        } catch {
            setItems([]);
            setParseError("Fehler beim Lesen oder Parsen.");
        }
    }, []);

    // Formatters
    const fmtMoney = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
    const fmtDate = (iso: string | null) => {
        if (!iso) return "—";
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            const [y, m, d] = iso.split("-").map(Number);
            const dt = new Date(y, m - 1, d);
            return new Intl.DateTimeFormat("de-DE").format(dt);
        }
        const d = new Date(iso);
        return isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("de-DE").format(d);
    };

    // Filter → Sort → Totals
    const filtered = useMemo(() => {
        return items.filter((tx) => {
            if (kindFilter !== "all" && tx.kind !== kindFilter) return false;
            if (from && (tx.date ?? "") < from) return false;
            if (to && (tx.date ?? "9999-12-31") > to) return false;
            return true;
        });
    }, [items, kindFilter, from, to]);

    function cmp(a: any, b: any, dir: "asc" | "desc") {
        if (a == null && b == null) return 0;
        if (a == null) return dir === "asc" ? -1 : 1;
        if (b == null) return dir === "asc" ? 1 : -1;
        if (a < b) return dir === "asc" ? -1 : 1;
        if (a > b) return dir === "asc" ? 1 : -1;
        return 0;
    }
    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((t1, t2) => {
            switch (sort.key) {
                case "amount": return cmp(t1.amount, t2.amount, sort.dir);
                case "date": return cmp(t1.date ?? "", t2.date ?? "", sort.dir);
                case "gruppe": return cmp(t1.gruppeId ?? "", t2.gruppeId ?? "", sort.dir);
                case "kat": return cmp(t1.kategorieId ?? "", t2.kategorieId ?? "", sort.dir);
                case "quelle": return cmp((t1.quelleName ?? t1.quelleId ?? ""), (t2.quelleName ?? t2.quelleId ?? ""), sort.dir);
                default: return 0;
            }
        });
        return arr;
    }, [filtered, sort]);

    const { total, incomeTotal, expenseTotal } = useMemo(() => {
        let bal = 0, inc = 0, exp = 0;
        for (const t of filtered) {
            const a = Number.isFinite(t.amount) ? t.amount : 0;
            bal += a;
            if (t.kind === "income") inc += a;
            else exp += a; // expense are negative
        }
        return { total: bal, incomeTotal: inc, expenseTotal: exp };
    }, [filtered]);

    const kindBadge = (k: Tx["kind"]) =>
        k === "income"
            ? "px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
            : "px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
    const amountClass = (k: Tx["kind"]) => (k === "income" ? "text-green-700 font-semibold" : "text-red-700 font-semibold");

    /** Delete by id — pure state update + persist. */
    function deleteById(id: string) {
        if (!id) return;
        const ok = confirm("Diesen Eintrag wirklich löschen?");
        if (!ok) return;
        setItems((prev) => {
            const next = prev.filter((t) => t.id !== id);
            writeTxList(next);
            return next;
        });
    }

    // Reset everything to defaults and clear persisted settings.
    function resetFiltersToDefault() {
        const defaults = {
            kindFilter: "all" as const,
            from: "",
            to: "",
            cols: { gruppe: true, kategorie: true, quelle: true, incomeType: true, remark: false, actions: true },
            sort: { key: "date", dir: "desc" as const },
        };
        setKindFilter(defaults.kindFilter);
        setFrom(defaults.from);
        setTo(defaults.to);
        setCols(defaults.cols);
        setSort(defaults.sort);
        localStorage.removeItem(SETTINGS_KEY);
    }

    if (parseError) {
        return (
            <section className="max-w-3xl mx-auto p-4 space-y-4">
                <PageHeader
                    left={<Link to="/guest" className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"><Arrowleft className="w-5 h-5" /> Zurück</Link>}
                    center={null}
                    right={<button aria-label="Einstellungen" className="p-2 rounded-md hover:bg-gray-100 transition" onClick={() => setSpinOnce(true)} type="button"><Settings className={`h-6 w-6 ${spinOnce ? "rotate-once" : ""}`} /></button>}
                />
                <div className="alert alert-error"><span>Fehlerhafte Daten: {parseError}</span></div>
                <p className="text-sm opacity-80">Lösche den Schlüssel <code>{TX_KEY}</code> im Local Storage und speichere die Transaktion erneut.</p>
            </section>
        );
    }

    return (
        <div className="bg-white">
            <style>{`
        @keyframes spin-once { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .rotate-once { animation: spin-once 0.6s linear 1; }
        thead.sticky thead th, thead.sticky th { position: sticky; top: 0; background: #fff; z-index: 1; }
      `}</style>

            <main className="py-6 flex flex-col">
                <PageHeader
                    left={<Link to="/guest" className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"><Arrowleft className="w-5 h-5" /> Zurück</Link>}
                    center={null}
                    right={
                        <div className="flex items-center gap-2">
                            <button className="btn btn-sm" onClick={() => download(`transactions_${Date.now()}.csv`, toCSV(filtered))}>CSV Export</button>
                            <button aria-label="Einstellungen" className="p-2 hover:bg-gray-100 transition rounded" onClick={() => {
                                if (spinOnce) return; setSpinOnce(true); setTimeout(() => setSpinOnce(false), 600);
                            }} type="button">
                                <Settings className={`h-6 w-6 ${spinOnce ? "rotate-once" : ""}`} />
                            </button>
                        </div>
                    }
                />

                {/* FILTER BAR — persisted via SETTINGS_KEY */}
                <div className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    {/* Filter: type */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Typ</label>
                        <select className="select select-bordered h-10" value={kindFilter} onChange={(e) => setKindFilter(e.target.value as any)}>
                            <option value="all">Alle</option>
                            <option value="income">Einnahmen</option>
                            <option value="expense">Ausgaben</option>
                        </select>
                    </div>

                    {/* Filter: date range */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Von (Datum)</label>
                        <input type="date" className="input input-bordered h-10" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Bis (Datum)</label>
                        <input type="date" className="input input-bordered h-10" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>

                    {/* Column toggles */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Spalten</label>
                        <div className="flex flex-wrap gap-2">
                            <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={cols.gruppe} onChange={() => toggleCol("gruppe")} /><span className="label-text text-xs">Gruppe</span></label>
                            <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={cols.kategorie} onChange={() => toggleCol("kategorie")} /><span className="label-text text-xs">Kategorie</span></label>
                            <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={cols.quelle} onChange={() => toggleCol("quelle")} /><span className="label-text text-xs">Quelle</span></label>
                            <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={cols.incomeType} onChange={() => toggleCol("incomeType")} /><span className="label-text text-xs">Typ (Einnahme)</span></label>
                            <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={cols.remark} onChange={() => toggleCol("remark")} /><span className="label-text text-xs">Bemerkung</span></label>
                            <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={cols.actions} onChange={() => toggleCol("actions")} /><span className="label-text text-xs">Aktionen</span></label>
                        </div>
                    </div>

                    {/* Reset button — clears LS and restores defaults */}
                    <div className="flex flex-col">
                        {/* Invisible label keeps grid alignment */}
                        <label className="text-xs text-gray-500 mb-1 opacity-0">Reset</label>
                        <button type="button" className="btn btn-outline h-10 text-sm" onClick={resetFiltersToDefault}>
                            {/* 🇩🇪 Native wording: */}
                            Filter&nbsp;zurücksetzen
                        </button>
                    </div>
                </div>

                {/* SUMMARY CARDS (computed from filtered) */}
                <div className="stats shadow w-full mt-4">
                    <div className="stat">
                        <div className="stat-title">Gesamtbilanz (gefiltert)</div>
                        <div className="stat-value">{fmtMoney(total)}</div>
                        <div className="stat-desc">{filtered.length} Einträge</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Einnahmen</div>
                        <div className="stat-value text-green-700">{fmtMoney(incomeTotal)}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Ausgaben</div>
                        <div className="stat-value text-red-700">{fmtMoney(expenseTotal)}</div>
                    </div>
                </div>

                {/* TABLE (sticky header, sorting, delete) */}
                {sorted.length === 0 ? (
                    <div className="card bg-base-200 p-6 mt-4">
                        <p className="opacity-80">Keine Daten für die aktuelle Auswahl.</p>
                        <div className="mt-3">
                            <Link to="/guestTransactionStep1" className="btn btn-primary">Neue Transaktion</Link>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto mt-4 max-h-[65vh] border rounded-lg">
                        <table className="table">
                            <thead className="sticky">
                                <tr>
                                    <th>Typ</th>
                                    <th className="cursor-pointer select-none" onClick={() => toggleSort("date")}>
                                        Datum {sort.key === "date" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                    </th>

                                    {cols.kategorie && (
                                        <th className="cursor-pointer select-none" onClick={() => toggleSort("kat")}>
                                            Kategorie {sort.key === "kat" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                    )}
                                    {cols.gruppe && (
                                        <th className="cursor-pointer select-none" onClick={() => toggleSort("gruppe")}>
                                            Gruppe {sort.key === "gruppe" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                    )}

                                    {cols.incomeType && <th>Typ (Einnahme)</th>}
                                    {cols.quelle && (
                                        <th className="cursor-pointer select-none" onClick={() => toggleSort("quelle")}>
                                            Quelle {sort.key === "quelle" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                    )}

                                    {cols.remark && <th>Bemerkung</th>}
                                    <th className="text-right cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                                        Betrag {sort.key === "amount" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                    </th>
                                    {cols.actions && <th className="text-right">Aktionen</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((tx) => (
                                    <tr key={tx.id}>
                                        <td><span className={kindBadge(tx.kind)}>{tx.kind === "income" ? "Income" : "Expense"}</span></td>
                                        <td>{fmtDate(tx.date)}</td>
                                        {cols.kategorie && (<td>{tx.kind === "expense" ? (tx.kategorieId || "—") : "—"}</td>)}
                                        {cols.gruppe && (<td>{tx.kind === "expense" ? (tx.gruppeId || "—") : "—"}</td>)}
                                        {cols.incomeType && (<td>{tx.kind === "income" ? (tx.incomeType || "—") : "—"}</td>)}
                                        {cols.quelle && (<td>{tx.kind === "income" ? (tx.quelleName || tx.quelleId || "—") : "—"}</td>)}
                                        {cols.remark && <td>{tx.remark || "—"}</td>}
                                        <td className={`text-right tabular-nums ${amountClass(tx.kind)}`}>{fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}</td>
                                        {cols.actions && (
                                            <td className="text-right">
                                                <button type="button" className="btn btn-ghost btn-xs text-red-600" aria-label="Transaktion löschen" onClick={() => deleteById(tx.id)}>
                                                    Löschen
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={
                                        2 + // Typ, Datum
                                        (cols.kategorie ? 1 : 0) +
                                        (cols.gruppe ? 1 : 0) +
                                        (cols.incomeType ? 1 : 0) +
                                        (cols.quelle ? 1 : 0) +
                                        (cols.remark ? 1 : 0)
                                    } className="text-right font-semibold">
                                        Summe (gefiltert):
                                    </td>
                                    <td className="text-right font-bold">{fmtMoney(total)}</td>
                                    {cols.actions && <td />}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
