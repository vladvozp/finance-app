import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Arrowleft from "../assets/Arrowleft.svg?react";
// import Settings from "../assets/Settings.svg?react";
import { Edit3, Trash2, SquarePlus, SquareMinus, Plus, Settings, ArchiveRestore, Search, Delete } from "lucide-react";

import type { Tx } from "../types/tx";
import { readKontoMap } from "../utils/lookups";
import { readTxList } from "../utils/storage";
import { writeTxList } from "../utils/storage";



const TX_KEY = "ft_transactions";
const SETTINGS_KEY = "ft_dashboard_settings_v1"; // bump version if shape changes



function debounce<T extends (...a: any) => void>(fn: T, ms = 250) {
    let t: number | undefined;
    // @ts-ignore
    return (...args: any[]) => { if (t) clearTimeout(t); t = window.setTimeout(() => fn(...args), ms); };
}

export default function Dashboard() {
    const [items, setItems] = useState<Tx[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

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
        konto: true,
    });

    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });

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

    const persistSettings = useRef(
        debounce((payload: any) => {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
        }, 250)
    ).current;

    useEffect(() => {
        persistSettings({ kindFilter, from, to, cols, sort });
    }, [kindFilter, from, to, cols, sort, persistSettings]);

    const toggleCol = (k: keyof typeof cols) => setCols((c) => ({ ...c, [k]: !c[k] }));
    const toggleSort = (key: string) =>
        setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

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

    const filtered = useMemo(() => {
        return items.filter((tx) => {
            if (kindFilter !== "all" && tx.kind !== kindFilter) return false;
            if (from && (tx.date ?? "") < from) return false;
            if (to && (tx.date ?? "9999-12-31") > to) return false;
            return true;
        });
    }, [items, kindFilter, from, to]);

    const kontoMap = useMemo(() => readKontoMap(), []);
    const getKontoName = (id?: string) => (id ? (kontoMap.get(id) ?? id) : "—");


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
                case "kind": return cmp(t1.kind, t2.kind, sort.dir);
                case "amount": return cmp(t1.amount, t2.amount, sort.dir);
                case "date": return cmp(t1.date ?? "", t2.date ?? "", sort.dir);
                case "gruppe": return cmp(t1.gruppeId ?? "", t2.gruppeId ?? "", sort.dir);
                case "kat": return cmp(t1.kategorieId ?? "", t2.kategorieId ?? "", sort.dir);
                case "quelle": return cmp((t1.quelleName ?? t1.quelleId ?? ""), (t2.quelleName ?? t2.quelleId ?? ""), sort.dir);
                case "incomeType": return cmp(t1.incomeType ?? "", t2.incomeType ?? "", sort.dir);
                case "konto": return cmp(getKontoName(t1.kontoId ?? ""), getKontoName(t2.kontoId ?? ""), sort.dir);
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
            ? "px-2 py-0.5 text-green-700"
            : "px-2 py-0.5 text-red-700";
    const amountClass = (k: Tx["kind"]) => (k === "income" ? "text-green-700 font-semibold" : "text-red-700 font-semibold");

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

    function resetFiltersToDefault() {
        const defaults = {
            kindFilter: "all" as const,
            from: "",
            to: "",
            cols: { gruppe: true, kategorie: true, quelle: true, incomeType: true, remark: false, konto: true, actions: true },
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
                    right={<Link
                        to="/SettingsPage"
                        aria-label="Einstellungen"
                        className="group p-2 transition rounded-lg"
                        type="button"
                    >
                        <Settings className="h-6 w-6 text-gray-600 transition-transform duration-500 group-hover:animate-spin" />
                    </Link>}
                />
                <div className="alert alert-error"><span>Fehlerhafte Daten: {parseError}</span></div>
                <p className="text-sm opacity-80">Lösche den Schlüssel <code>{TX_KEY}</code> im Local Storage und speichere die Transaktion erneut.</p>
            </section>
        );
    }

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guest"
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <Arrowleft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={null}
                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group p-2 transition rounded-lg inline-flex items-center justify-center"
                            type="button"
                        >
                            <Settings className="block transform h-5 w-5 text-gray-600 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />
                {/* ======= SUMMARY (Result) ======= */}
                <section className="stats border shadow w-full mt-4" role="region" aria-labelledby="summary-heading">
                    <h2 id="summary-heading" className="sr-only">Zusammenfassung</h2>
                    <div className="stat">
                        <div className="stat-title font-semibold">Gesamtbilanz (gefiltert)</div>
                        <div className="stat-value font-semibold">{fmtMoney(total)}</div>
                        <div className="stat-desc">{filtered.length} Einträge</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title font-semibold">Einnahmen</div>
                        <div className="stat-value text-green-700">{fmtMoney(incomeTotal)}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title font-semibold">Ausgaben</div>
                        <div className="stat-value text-red-700">{fmtMoney(expenseTotal)}</div>
                    </div>
                </section>

                {/* ======= FILTERS (Top) ======= */}
                <section
                    className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                    role="region"
                    aria-labelledby="filters-heading"
                >
                    <h2 id="filters-heading" className="sr-only">Filter</h2>

                    {/* Typ */}
                    <div className="flex flex-col">
                        <label htmlFor="filter-typ" className="text-xs text-gray-500 mb-1">Typ</label>
                        <select id="filter-typ" className="select select-bordered h-10" value={kindFilter} onChange={(e) => setKindFilter(e.target.value as any)}>
                            <option value="all">Alle</option>
                            <option value="income">Einnahmen</option>
                            <option value="expense">Ausgaben</option>
                        </select>
                    </div>

                    {/* Von */}
                    <div className="flex flex-col">
                        <label htmlFor="filter-from" className="text-xs text-gray-500 mb-1">Von (Datum)</label>
                        <input id="filter-from" type="date" className="input input-bordered h-10" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>

                    {/* Bis */}
                    <div className="flex flex-col">
                        <label htmlFor="filter-to" className="text-xs text-gray-500 mb-1">Bis (Datum)</label>
                        <input id="filter-to" type="date" className="input input-bordered h-10" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>

                    {/* Reset */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1 opacity-0">Reset</label>
                        <button type="button" className="h-10 text-sm" onClick={resetFiltersToDefault}>
                            zurücksetzen <ArchiveRestore className="w-5 h-5" />
                        </button>
                    </div>
                </section>


                {/* ======= SPALTEN (Accordion, under result) ======= */}
                <section className="mt-4" role="region" aria-labelledby="columns-heading">
                    <h2 id="columns-heading" className="sr-only">Anzeigeoptionen</h2>

                    <details className="bg-base-100 border open:shadow-sm">
                        <summary
                            className="cursor-pointer list-none px-4 py-3 flex items-center justify-between"
                            aria-controls="columns-panel"
                            aria-expanded={undefined /* handled natively by <details> */}
                        >
                            <span className="font-medium text-sm">Anzeigeoptionen</span>
                            <span aria-hidden>▾</span>
                        </summary>

                        <div id="columns-panel" className="px-4 pb-4">
                            <div className="flex flex-wrap gap-3">
                                <label className="label cursor-pointer gap-2">
                                    <input type="checkbox" className="checkbox checkbox-sm" checked={cols.konto} onChange={() => toggleCol("konto")} />
                                    <span className="label-text text-xs">Konto</span>
                                </label>
                                <label className="label cursor-pointer gap-2">
                                    <input type="checkbox" className="checkbox checkbox-sm" checked={cols.gruppe} onChange={() => toggleCol("gruppe")} />
                                    <span className="label-text text-xs">Gruppe</span>
                                </label>
                                <label className="label cursor-pointer gap-2">
                                    <input type="checkbox" className="checkbox checkbox-sm" checked={cols.kategorie} onChange={() => toggleCol("kategorie")} />
                                    <span className="label-text text-xs">Kategorie</span>
                                </label>
                                <label className="label cursor-pointer gap-2">
                                    <input type="checkbox" className="checkbox checkbox-sm" checked={cols.quelle} onChange={() => toggleCol("quelle")} />
                                    <span className="label-text text-xs">Quelle</span>
                                </label>
                                <label className="label cursor-pointer gap-2">
                                    <input type="checkbox" className="checkbox checkbox-sm" checked={cols.incomeType} onChange={() => toggleCol("incomeType")} />
                                    <span className="label-text text-xs">Typ (Einnahme)</span>
                                </label>
                                <label className="label cursor-pointer gap-2">
                                    <input type="checkbox" className="checkbox checkbox-sm" checked={cols.remark} onChange={() => toggleCol("remark")} />
                                    <span className="label-text text-xs">Bemerkung</span>
                                </label>
                                <label className="label cursor-pointer gap-2">
                                    <input type="checkbox" className="checkbox checkbox-sm" checked={cols.actions} onChange={() => toggleCol("actions")} />
                                    <span className="label-text text-xs">Aktionen</span>
                                </label>
                            </div>
                        </div>
                    </details>
                </section>

                {/* ======= TABLE ======= */}
                {sorted.length === 0 ? (
                    <div className="card bg-base-200 p-6 mt-4">
                        <p className="opacity-80">Keine Daten für die aktuelle Auswahl.</p>
                        <div className="mt-3">
                            <Link to="/guestTransactionStep1" className="btn btn-primary">Neue Transaktion</Link>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto mt-4 max-h-[65vh] border shadow-sm">
                        <table className="table">
                            <thead className="sticky">
                                <tr>
                                    <th
                                        className="cursor-pointer select-none"
                                        onClick={() => toggleSort("kind")}
                                    >
                                        Typ {sort.key === "kind" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                    </th>
                                    <th className="cursor-pointer select-none" onClick={() => toggleSort("date")}>
                                        Datum {sort.key === "date" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                    </th>
                                    {cols.konto && (
                                        <th className="cursor-pointer select-none" onClick={() => toggleSort("konto")}>
                                            Konto {sort.key === "konto" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                    )}
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

                                    {cols.incomeType && (
                                        <th className="cursor-pointer select-none" onClick={() => toggleSort("incomeType")}>
                                            Typ (Einnahme) {sort.key === "quelle" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>)}

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
                                        <td>
                                            <span className={kindBadge(tx.kind)}>
                                                {tx.kind === "income" ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <SquarePlus className="w-3.5 h-3.5" />

                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1">
                                                        <SquareMinus className="w-3.5 h-3.5" />

                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td>{fmtDate(tx.date)}</td>
                                        {cols.konto && (<td>{getKontoName(tx.kontoId ?? undefined)}</td>)}
                                        {cols.kategorie && (<td>{tx.kind === "expense" ? (tx.kategorieId || "—") : "—"}</td>)}
                                        {cols.gruppe && (<td>{tx.kind === "expense" ? (tx.gruppeId || "—") : "—"}</td>)}
                                        {cols.incomeType && (<td>{tx.kind === "income" ? (tx.incomeType || "—") : "—"}</td>)}
                                        {cols.quelle && (<td>{tx.kind === "income" ? (tx.quelleName || tx.quelleId || "—") : "—"}</td>)}
                                        {cols.remark && <td>{tx.remark || "—"}</td>}
                                        <td className={`text-right tabular-nums ${amountClass(tx.kind)}`}>{fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}</td>
                                        {cols.actions && (
                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    aria-label="Transaktion löschen"
                                                    onClick={() => deleteById(tx.id)}
                                                    className="p-1 text-gray-600 hover:text-red-600 transition cursor-pointer hover:scale-110"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
