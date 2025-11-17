// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Arrowleft from "../assets/Arrowleft.svg?react";
import { Trash2, SquarePlus, SquareMinus, Settings, ArchiveRestore } from "lucide-react";

import type { Tx } from "../types/tx";
import { readKontoMap } from "../utils/lookups";
import { readTxList, writeTxList } from "../utils/storage";
import { useDicts } from "../store/dicts";
import { computeAccountBalance } from "../utils/accountBalance";

const TX_KEY = "ft_transactions";
const ACC_KEY = "ft_accounts";
const SETTINGS_KEY = "ft_dashboard_settings_v4"; // bump when shape changes

/** Simple debounce helper to avoid excessive LocalStorage writes */
function debounce<T extends (...a: any[]) => void>(fn: T, ms = 250) {
    let t: number | undefined;
    // @ts-ignore
    return (...args: any[]) => {
        if (t) clearTimeout(t);
        t = window.setTimeout(() => fn(...args), ms);
    };
}

/** Name resolver (ID -> human label). Supports array/record shapes, falls back to ID. */
function lookupNameById(id?: string | null, collection?: any): string | null {
    if (!id || !collection) return null;
    if (Array.isArray(collection)) {
        const item = collection.find((x) => x?.id === id || x?.value === id || x?.key === id);
        return item?.name ?? item?.label ?? item?.title ?? null;
    }
    if (typeof collection === "object") {
        const item = collection[id];
        if (!item) return null;
        if (typeof item === "string") return item;
        return item?.name ?? item?.label ?? item?.title ?? null;
    }
    return null;
}

/** Build flattened Kategorie options from different possible dict shapes */
function buildKategorieOptions(kategorien: any): { id: string; label: string }[] {
    const result: { id: string; label: string }[] = [];
    const seen = new Set<string>();

    if (!kategorien) return result;

    const push = (id: string | undefined | null, label: string | undefined | null) => {
        if (!id) return;
        const cleanId = String(id);
        if (seen.has(cleanId)) return;
        seen.add(cleanId);
        result.push({ id: cleanId, label: label || cleanId });
    };

    if (Array.isArray(kategorien)) {
        for (const k of kategorien) {
            const id = k?.id ?? k?.value ?? k?.key;
            const label = k?.name ?? k?.label ?? k?.title ?? id;
            push(id, label);
        }
        return result;
    }

    if (typeof kategorien === "object") {
        for (const [outerKey, outerVal] of Object.entries(kategorien)) {
            if (!outerVal) continue;

            // Flat: { catId: "Lebensmittel" } or { catId: { name: ... } }
            if (typeof outerVal === "string") {
                push(outerKey, outerVal);
                continue;
            }

            const hasDirectName =
                typeof outerVal === "object" &&
                ("name" in (outerVal as any) ||
                    "label" in (outerVal as any) ||
                    "title" in (outerVal as any));

            if (hasDirectName) {
                const ov: any = outerVal;
                const id = ov.id ?? outerKey;
                const label = ov.name ?? ov.label ?? ov.title ?? id;
                push(id, label);
                continue;
            }

            // Nested per group: { gruppeId: [ {id,name}, ... ] } or { gruppeId: { catId: {...} } }
            if (Array.isArray(outerVal)) {
                for (const k of outerVal as any[]) {
                    const id = k?.id ?? k?.value ?? k?.key;
                    const label = k?.name ?? k?.label ?? k?.title ?? id;
                    push(id, label);
                }
            } else if (typeof outerVal === "object") {
                for (const [innerKey, innerVal] of Object.entries(outerVal as any)) {
                    if (!innerVal) continue;
                    if (typeof innerVal === "string") {
                        push(innerKey, innerVal);
                    } else {
                        const iv: any = innerVal;
                        const id = iv.id ?? innerKey;
                        const label = iv.name ?? iv.label ?? iv.title ?? id;
                        push(id, label);
                    }
                }
            }
        }
    }

    return result;
}

export default function Dashboard() {
    const location = useLocation();

    const [items, setItems] = useState<Tx[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    /** ---------- PERSISTED VIEW/QUERY STATE ---------- */
    const [kindFilter, setKindFilter] = useState<"all" | "income" | "expense">("all");
    const [from, setFrom] = useState<string>(""); // YYYY-MM-DD
    const [to, setTo] = useState<string>(""); // YYYY-MM-DD

    // Supplier (Anbieter) filter (flat dictionary only)
    const [anbieterFilter, setAnbieterFilter] = useState<string>("");

    // Kategorie filter (works across all expense categories)
    const [kategorieFilter, setKategorieFilter] = useState<string>("");

    const [cols, setCols] = useState({
        konto: true,
        gruppe: true,
        kategorie: true,
        anbieter: true,
        incomeType: true,
        quelle: true,
        remark: false,
        actions: true,
    });

    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
        key: "date",
        dir: "desc",
    });

    /** ---------- DICTS (flat only) ---------- */
    const { gruppen, kategorien, anbieter } = useDicts?.() || {};
    const kategorieOptions = useMemo(
        () => buildKategorieOptions(kategorien),
        [kategorien]
    );

    /** Format helpers */
    const fmtMoney = (n: number) =>
        new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

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

    /** Name lookups (best-effort; fallbacks to IDs) */
    const getKontoName = (() => {
        const kontoMap = readKontoMap(); // read once
        return (id?: string) => (id ? kontoMap.get(id) ?? id : "—");
    })();

    const getGruppeName = (gid?: string | null) =>
        lookupNameById(gid ?? undefined, gruppen) ?? (gid ?? "—");

    const getKategorieName = (gid?: string | null, kid?: string | null) => {
        if (!kid) return "—";
        const col =
            (kategorien && (kategorien[gid ?? ""] || kategorien[gid as any])) || null;
        return lookupNameById(kid, col) ?? lookupNameById(kid, kategorien) ?? kid;
    };

    const getAnbieterName = (aid?: string | null) =>
        lookupNameById(aid ?? undefined, anbieter) ?? (aid ?? "—");

    /** ---------- Load persisted settings ---------- */
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
            if (typeof s?.anbieterFilter === "string") setAnbieterFilter(s.anbieterFilter);
            if (typeof s?.kategorieFilter === "string") setKategorieFilter(s.kategorieFilter);
        } catch {
            /* ignore malformed settings */
        }
    }, []);

    /** ---------- Persist settings (debounced) ---------- */
    const persistSettings = useRef(
        debounce((payload: any) => {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
        }, 250)
    ).current;

    useEffect(() => {
        persistSettings({
            kindFilter,
            from,
            to,
            cols,
            sort,
            anbieterFilter,
            kategorieFilter,
        });
    }, [kindFilter, from, to, cols, sort, anbieterFilter, kategorieFilter, persistSettings]);

    /** ---------- Load transactions ---------- */
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

    /** ---------- Filtering ---------- */
    const filtered = useMemo(() => {
        return items.filter((tx) => {
            if (kindFilter !== "all" && tx.kind !== kindFilter) return false;
            if (from && (tx.date ?? "") < from) return false;
            if (to && (tx.date ?? "9999-12-31") > to) return false;

            if (anbieterFilter && tx.kind === "expense" && tx.anbieterId !== anbieterFilter)
                return false;

            if (kategorieFilter && tx.kind === "expense" && tx.kategorieId !== kategorieFilter)
                return false;

            return true;
        });
    }, [items, kindFilter, from, to, anbieterFilter, kategorieFilter]);

    /** ---------- Sorting ---------- */
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
                case "kind":
                    return cmp(t1.kind, t2.kind, sort.dir);
                case "amount":
                    return cmp(t1.amount, t2.amount, sort.dir);
                case "date":
                    return cmp(t1.date ?? "", t2.date ?? "", sort.dir);
                case "konto":
                    return cmp(
                        getKontoName(t1.kontoId ?? ""),
                        getKontoName(t2.kontoId ?? ""),
                        sort.dir
                    );
                case "gruppe":
                    return cmp(
                        getGruppeName(t1.gruppeId ?? ""),
                        getGruppeName(t2.gruppeId ?? ""),
                        sort.dir
                    );
                case "kat":
                    return cmp(
                        getKategorieName(t1.gruppeId ?? "", t1.kategorieId ?? ""),
                        getKategorieName(t2.gruppeId ?? "", t2.kategorieId ?? ""),
                        sort.dir
                    );
                case "anbieter":
                    return cmp(
                        getAnbieterName(t1.anbieterId ?? ""),
                        getAnbieterName(t2.anbieterId ?? ""),
                        sort.dir
                    );
                case "incomeType":
                    return cmp(t1.incomeType ?? "", t2.incomeType ?? "", sort.dir);
                case "quelle":
                    return cmp(
                        t1.quelleName ?? t1.quelleId ?? "",
                        t2.quelleName ?? t2.quelleId ?? "",
                        sort.dir
                    );
                default:
                    return 0;
            }
        });
        return arr;
    }, [filtered, sort]);

    /** ---------- Accounts with balances (always fresh from localStorage) ---------- */
    const accountsWithBalance = useMemo(() => {
        let accs: any[] = [];
        try {
            const raw = localStorage.getItem(ACC_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) accs = parsed;
            }
        } catch {
            accs = [];
        }

        return accs.map((acc) => ({
            ...acc,
            balance: computeAccountBalance(acc, items),
        }));
    }, [items, location.key]);

    /** ---------- Aggregates ---------- */
    const {
        total,
        incomeTotal,
        expenseTotal,
        filteredTotal,
    } = useMemo(() => {
        const total = accountsWithBalance.reduce(
            (s, acc) => s + (acc.balance ?? 0),
            0
        );

        let inc = 0;
        let exp = 0;
        for (const t of filtered) {
            const a = Number.isFinite(t.amount) ? t.amount : 0;
            if (t.kind === "income") inc += a;
            else exp += a;
        }

        const filteredTotal = inc + exp;

        return { total, incomeTotal: inc, expenseTotal: exp, filteredTotal };
    }, [accountsWithBalance, filtered]);

    /** ---------- UI helpers ---------- */
    const kindBadge = (k: Tx["kind"]) =>
        k === "income" ? "px-2 py-0.5 text-green-700" : "px-2 py-0.5 text-red-700";
    const amountClass = (k: Tx["kind"]) =>
        k === "income" ? "text-green-700 font-semibold" : "text-red-700 font-semibold";

    function toggleSort(key: string) {
        setSort((s) =>
            s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
        );
    }

    function toggleCol(k: keyof typeof cols) {
        setCols((c) => ({ ...c, [k]: !c[k] }));
    }

    /** Delete by id with optimistic UI update */
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

    /** One-click reset to safe defaults and wipe saved view settings */
    function resetFiltersToDefault() {
        const defaults = {
            kindFilter: "all" as const,
            from: "",
            to: "",
            cols: {
                konto: true,
                gruppe: true,
                kategorie: true,
                anbieter: true,
                incomeType: true,
                quelle: true,
                remark: false,
                actions: true,
            },
            sort: { key: "date", dir: "desc" as const },
            anbieterFilter: "",
            kategorieFilter: "",
        };
        setKindFilter(defaults.kindFilter);
        setFrom(defaults.from);
        setTo(defaults.to);
        setCols(defaults.cols);
        setSort(defaults.sort);
        setAnbieterFilter(defaults.anbieterFilter);
        setKategorieFilter(defaults.kategorieFilter);
        localStorage.removeItem(SETTINGS_KEY);
    }

    /** ---------- Error state ---------- */
    if (parseError) {
        return (
            <section className="max-w-3xl mx-auto p-4 space-y-4">
                <PageHeader
                    left={
                        <Link
                            to="/guest"
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <Arrowleft className="w-5 h-5" /> Zurück
                        </Link>
                    }
                    center={null}
                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group p-2 transition rounded-lg"
                            type="button"
                        >
                            <Settings className="h-6 w-6 text-gray-600 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />
                <div className="alert alert-error">
                    <span>Fehlerhafte Daten: {parseError}</span>
                </div>
                <p className="text-sm opacity-80">
                    Lösche den Schlüssel <code>{TX_KEY}</code> im Local Storage und speichere die
                    Transaktion erneut.
                </p>
            </section>
        );
    }

    /** ---------- Main UI ---------- */
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

                {/* ======= SUMMARY ======= */}
                <section
                    className="stats border shadow-sm border-gray-500 w-full mt-4"
                    role="region"
                    aria-labelledby="summary-heading"
                >
                    <h2 id="summary-heading" className="sr-only">
                        Summary
                    </h2>
                    <div className="stat">
                        <div className="stat-title font-semibold">Gesamtbestand (alle Konten)</div>
                        <div className="stat-value font-semibold">{fmtMoney(total)}</div>
                        <div className="stat-desc text-xs">
                            {accountsWithBalance.length} Konten · {filtered.length} Buchungen (gefiltert)
                        </div>
                    </div>
                    <div className="stat">
                        <div className="stat-title font-semibold">Income (gefiltert)</div>
                        <div className="stat-value text-green-700">
                            {fmtMoney(incomeTotal)}
                        </div>
                    </div>
                    <div className="stat">
                        <div className="stat-title font-semibold">Expenses (gefiltert)</div>
                        <div className="stat-value text-red-700">
                            {fmtMoney(expenseTotal)}
                        </div>
                    </div>
                </section>

                {/* ======= FILTER BAR ======= */}
                <section
                    className="mt-2 grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
                    role="region"
                    aria-labelledby="filters-heading"
                >
                    <h2 id="filters-heading" className="sr-only">
                        Filters
                    </h2>

                    <div className="flex flex-col">
                        <label htmlFor="filter-typ" className="text-xs text-gray-500 mb-1">
                            Transaktion Typ
                        </label>
                        <select
                            id="filter-typ"
                            className="select select-bordered h-10"
                            value={kindFilter}
                            onChange={(e) => setKindFilter(e.target.value as any)}
                        >
                            <option value="all">All</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="filter-from" className="text-xs text-gray-500 mb-1">
                            Von
                        </label>
                        <input
                            id="filter-from"
                            type="date"
                            className="input input-bordered h-10"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="filter-to" className="text-xs text-gray-500 mb-1">
                            Bis
                        </label>
                        <input
                            id="filter-to"
                            type="date"
                            className="input input-bordered h-10"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="filter-anbieter" className="text-xs text-gray-500 mb-1">
                            Anbieter
                        </label>
                        <select
                            id="filter-anbieter"
                            className="select select-bordered h-10"
                            value={anbieterFilter}
                            onChange={(e) => setAnbieterFilter(e.target.value)}
                        >
                            <option value="">All</option>
                            {Array.isArray(anbieter)
                                ? anbieter.map((a: any) => (
                                    <option key={a.id ?? a.value} value={a.id ?? a.value}>
                                        {a.name ?? a.label ?? a.title ?? (a.id ?? "")}
                                    </option>
                                ))
                                : anbieter
                                    ? Object.entries(anbieter).map(([id, val]: any) => (
                                        <option key={id} value={id}>
                                            {typeof val === "string"
                                                ? val
                                                : val?.name ?? val?.label ?? val?.title ?? id}
                                        </option>
                                    ))
                                    : null}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="filter-kategorie" className="text-xs text-gray-500 mb-1">
                            Kategorie
                        </label>
                        <select
                            id="filter-kategorie"
                            className="select select-bordered h-10"
                            value={kategorieFilter}
                            onChange={(e) => setKategorieFilter(e.target.value)}
                        >
                            <option value="">All</option>
                            {kategorieOptions.map((k) => (
                                <option key={k.id} value={k.id}>
                                    {k.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1 opacity-0">Reset</label>
                        <button type="button" className="h-10 text-sm" onClick={resetFiltersToDefault}>
                            zurücksetzen <ArchiveRestore className="w-5 h-5" />
                        </button>
                    </div>
                </section>

                {/* ======= COLUMN PREFERENCES ======= */}
                <section className="mt-4" role="region" aria-labelledby="columns-heading">
                    <h2 id="columns-heading" className="sr-only">
                        Column visibility
                    </h2>
                    <details className="bg-base-100 border shadow-sm border-gray-500 open:shadow-sm">
                        <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
                            <span className="font-medium text-sm">Anzeigeoptionen</span>
                            <span aria-hidden>▾</span>
                        </summary>
                        <div id="columns-panel" className="px-4 pb-4">
                            <div className="flex flex-wrap gap-3">
                                {(
                                    [
                                        ["konto", "Konto"],
                                        ["gruppe", "Gruppe"],
                                        ["kategorie", "Kategorie"],
                                        ["anbieter", "Anbieter"],
                                        ["incomeType", "Typ (Einnahme)"],
                                        ["quelle", "Quelle"],
                                        ["remark", "Bemerkung"],
                                        ["actions", "Aktionen"],
                                    ] as const
                                ).map(([key, label]) => (
                                    <label className="label cursor-pointer gap-2" key={key}>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={(cols as any)[key]}
                                            onChange={() => toggleCol(key as keyof typeof cols)}
                                        />
                                        <span className="label-text text-xs">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </details>
                </section>

                {/* ======= TABLE ======= */}
                {sorted.length === 0 ? (
                    <div className="card bg-base-200 p-6 mt-4">
                        <p className="opacity-80">Keine Daten für die aktuelle Auswahl.</p>
                        <div className="mt-3">
                            <Link to="/guestTransactionStep1" className="btn btn-primary">
                                Neue Transaktion
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto mt-4 max-h-[65vh] border shadow-sm border-gray-500">
                        <table className="table">
                            <thead className="sticky">
                                <tr>
                                    <th
                                        className="cursor-pointer select-none"
                                        onClick={() => toggleSort("kind")}
                                    >
                                        Typ {sort.key === "kind" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                    </th>
                                    <th
                                        className="cursor-pointer select-none"
                                        onClick={() => toggleSort("date")}
                                    >
                                        Datum{" "}
                                        {sort.key === "date" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                    </th>
                                    {cols.konto && (
                                        <th
                                            className="cursor-pointer select-none"
                                            onClick={() => toggleSort("konto")}
                                        >
                                            Konto{" "}
                                            {sort.key === "konto" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                    )}
                                    {cols.kategorie && (
                                        <th
                                            className="cursor-pointer select-none"
                                            onClick={() => toggleSort("kat")}
                                        >
                                            Kategorie{" "}
                                            {sort.key === "kat" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                    )}
                                    {cols.gruppe && (
                                        <th
                                            className="cursor-pointer select-none"
                                            onClick={() => toggleSort("gruppe")}
                                        >
                                            Gruppe{" "}
                                            {sort.key === "gruppe" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                    )}
                                    {cols.anbieter && (
                                        <th
                                            className="cursor-pointer select-none"
                                            onClick={() => toggleSort("anbieter")}
                                        >
                                            Anbieter{" "}
                                            {sort.key === "anbieter" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                    )}
                                    {cols.incomeType && (
                                        <th
                                            className="cursor-pointer select-none"
                                            onClick={() => toggleSort("incomeType")}
                                        >
                                            Typ (Einnahme){" "}
                                            {sort.key === "incomeType"
                                                ? sort.dir === "asc"
                                                    ? "▲"
                                                    : "▼"
                                                : ""}
                                        </th>
                                    )}
                                    {cols.quelle && (
                                        <th
                                            className="cursor-pointer select-none"
                                            onClick={() => toggleSort("quelle")}
                                        >
                                            Quelle{" "}
                                            {sort.key === "quelle" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                                        </th>
                                    )}
                                    {cols.remark && <th>Bemerkung</th>}
                                    <th
                                        className="text-right cursor-pointer select-none"
                                        onClick={() => toggleSort("amount")}
                                    >
                                        Betrag{" "}
                                        {sort.key === "amount" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
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
                                        <td>{fmtDate(tx.date ?? null)}</td>
                                        {cols.konto && <td>{getKontoName(tx.kontoId ?? undefined)}</td>}
                                        {cols.kategorie && (
                                            <td>
                                                {tx.kind === "expense"
                                                    ? getKategorieName(
                                                        tx.gruppeId ?? null,
                                                        tx.kategorieId ?? null
                                                    )
                                                    : "—"}
                                            </td>
                                        )}
                                        {cols.gruppe && (
                                            <td>
                                                {tx.kind === "expense"
                                                    ? getGruppeName(tx.gruppeId ?? null)
                                                    : "—"}
                                            </td>
                                        )}
                                        {cols.anbieter && (
                                            <td>
                                                {tx.kind === "expense"
                                                    ? getAnbieterName(tx.anbieterId ?? null)
                                                    : "—"}
                                            </td>
                                        )}
                                        {cols.incomeType && (
                                            <td>{tx.kind === "income" ? tx.incomeType || "—" : "—"}</td>
                                        )}
                                        {cols.quelle && (
                                            <td>
                                                {tx.kind === "income"
                                                    ? tx.quelleName || tx.quelleId || "—"
                                                    : "—"}
                                            </td>
                                        )}
                                        {cols.remark && <td>{tx.remark || "—"}</td>}
                                        <td
                                            className={`text-right tabular-nums ${amountClass(tx.kind)}`}
                                        >
                                            {fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}
                                        </td>
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
                                    <td
                                        colSpan={
                                            2 + // Typ, Datum
                                            (cols.konto ? 1 : 0) +
                                            (cols.kategorie ? 1 : 0) +
                                            (cols.gruppe ? 1 : 0) +
                                            (cols.anbieter ? 1 : 0) +
                                            (cols.incomeType ? 1 : 0) +
                                            (cols.quelle ? 1 : 0) +
                                            (cols.remark ? 1 : 0)
                                        }
                                        className="text-right font-semibold"
                                    >
                                        Summe (gefiltert):
                                    </td>
                                    <td className="text-right font-bold">
                                        {fmtMoney(filteredTotal)}
                                    </td>
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
