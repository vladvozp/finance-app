import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import Arrowleft from "../assets/Arrowleft.svg?react";

import Button from "../components/Button";
import { Plus } from "lucide-react";

import type { Tx } from "../types/tx";
import { readTxList, updateTxStatus } from "../utils/storage";
import { computeAccountBalance } from "../utils/accountBalance";
import { readKontoMap } from "../utils/lookups";
import { useDicts } from "../store/dicts";

const ACC_KEY = "ft_accounts";

function fmtMoney(n: number) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(n);
}

function fmtDate(iso: string | null | undefined) {
    if (!iso) return "—";
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        const [y, m, d] = iso.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        return new Intl.DateTimeFormat("de-DE").format(dt);
    }
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("de-DE").format(d);
}

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

/** ===== Month helpers (NEW) ===== */
function addMonths(base: Date, delta: number) {
    return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}
function monthPrefix(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}
function monthLabelDE(d: Date) {
    return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(d);
}

export default function MonthPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState<Tx[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    const [onlyPlanned, setOnlyPlanned] = useState(false);

    const todayISO = new Date().toISOString().slice(0, 10);

    /** ===== Selected month state (NEW) ===== */
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const selectedMonthPrefix = useMemo(() => monthPrefix(selectedMonth), [selectedMonth]);
    const selectedMonthLabel = useMemo(() => monthLabelDE(selectedMonth), [selectedMonth]);

    const goPrevMonth = () => setSelectedMonth((m) => addMonths(m, -1));
    const goNextMonth = () => setSelectedMonth((m) => addMonths(m, +1));
    const goThisMonth = () => {
        const d = new Date();
        setSelectedMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    };

    const markBooked = (id: string) => {
        const next = updateTxStatus(id, "booked");
        setItems(next);
    };

    const markCancelled = (id: string) => {
        const next = updateTxStatus(id, "cancelled");
        setItems(next);
    };

    /** DICTS */
    const { kategorien, anbieter } = useDicts?.() || {};

    const getKontoName = (() => {
        const kontoMap = readKontoMap();
        return (id?: string) => (id ? kontoMap.get(id) ?? id : "—");
    })();

    const getKategorieName = (gid?: string | null, kid?: string | null) => {
        if (!kid) return "—";
        const col = (kategorien && (kategorien[gid ?? ""] || kategorien[gid as any])) || null;
        return lookupNameById(kid, col) ?? lookupNameById(kid, kategorien) ?? kid;
    };

    const getAnbieterName = (aid?: string | null) =>
        lookupNameById(aid ?? undefined, anbieter) ?? (aid ?? "—");

    /** Load transactions once */
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

    useEffect(() => {
        const negExp = items.filter((t) => t.kind === "expense" && (t.amount ?? 0) < 0);
        console.log("Negative expense count:", negExp.length);
    }, [items]);

    /** Load accounts + balances */
    const actualItems = useMemo(
        () => items.filter((t) => t.status !== "planned" && t.status !== "cancelled"),
        [items]
    );

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
            balance: computeAccountBalance(acc, actualItems),
        }));
    }, [actualItems]);

    const totalBalance = useMemo(
        () => accountsWithBalance.reduce((s, acc) => s + (acc.balance ?? 0), 0),
        [accountsWithBalance]
    );

    /** Filter tx for SELECTED month (CHANGED) */
    const monthTx = useMemo(
        () => items.filter((tx) => (tx.date ?? "").startsWith(selectedMonthPrefix)),
        [items, selectedMonthPrefix]
    );

    /** Aggregates for red / yellow / green */
    const monthBookedTx = useMemo(
        () => monthTx.filter((tx) => tx.status !== "planned" && tx.status !== "cancelled"),
        [monthTx]
    );

    const expenseTotal = useMemo(
        () =>
            monthBookedTx.reduce((sum, tx) => {
                if (tx.kind !== "expense") return sum;
                const a = Number.isFinite(tx.amount) ? tx.amount : 0;
                return sum + Math.abs(a);
            }, 0),
        [monthBookedTx]
    );

    const monthPlannedTx = useMemo(() => monthTx.filter((tx) => tx.status === "planned"), [monthTx]);

    const tableTx = useMemo(
        () => (onlyPlanned ? monthTx.filter((t) => t.status === "planned") : monthTx),
        [onlyPlanned, monthTx]
    );

    const futureTotal = useMemo(
        () =>
            monthPlannedTx.reduce((sum, tx) => {
                if (tx.kind !== "expense") return sum;
                const a = Number.isFinite(tx.amount) ? tx.amount : 0;
                return sum + Math.abs(a);
            }, 0),
        [monthPlannedTx]
    );

    const available = totalBalance - futureTotal;

    // debug balance error
    useEffect(() => {
        console.log("=== MONTH DEBUG ===");
        console.log("selectedMonth:", selectedMonthPrefix, selectedMonthLabel);
        console.log("accountsWithBalance:", accountsWithBalance);
        console.log("totalBalance:", totalBalance);
        console.log("expenseTotal:", expenseTotal);
        console.log("futureTotal:", futureTotal);
        console.log("available:", available);
    }, [
        selectedMonthPrefix,
        selectedMonthLabel,
        accountsWithBalance,
        totalBalance,
        expenseTotal,
        futureTotal,
        available,
    ]);

    /** Error view */
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
                    right={null}
                />
                <div className="alert alert-error">
                    <span>Fehlerhafte Daten: {parseError}</span>
                </div>
            </section>
        );
    }

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col max-w-5xl mx-auto px-4 gap-4">
                <p className="text-xs text-red-500">DEBUG MonthPage ACTIVE</p>

                <PageHeader
                    left={
                        <Link
                            to="/login"
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <Arrowleft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={
                        /** ===== Month navigation (NEW) ===== */
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={goPrevMonth}
                                className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                aria-label="Vorheriger Monat"
                            >
                                ‹
                            </button>

                            <div className="flex flex-col items-center leading-tight">
                                <h1 className="text-lg font-semibold text-gray-800">{selectedMonthLabel}</h1>
                                <button
                                    type="button"
                                    onClick={goThisMonth}
                                    className="text-xs text-gray-500 underline hover:text-gray-700"
                                >
                                    Dieser Monat
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={goNextMonth}
                                className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                aria-label="Nächster Monat"
                            >
                                ›
                            </button>
                        </div>
                    }
                    right={null}
                />

                {/* ====== HAUPTKONTO BALANCE (NEW) ====== */}
                <section className="border rounded-xl p-3 bg-white">
                    <div className="text-xs text-gray-500">Hauptkonto (Gesamt)</div>
                    <div className="text-xl font-bold text-gray-900">{fmtMoney(totalBalance)}</div>
                </section>

                {/* ====== RYG SUMMARY ====== */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border rounded-xl p-3 bg-red-50 border-red-200">
                        <div className="text-xs font-semibold text-red-700">Bereits ausgegeben</div>
                        <div className="text-lg font-bold text-red-800">{fmtMoney(expenseTotal)}</div>
                        <p className="text-[11px] text-red-700 mt-1">Alle Ausgaben in diesem Monat.</p>
                    </div>

                    <div className="border rounded-xl p-3 bg-yellow-50 border-yellow-200">
                        <div className="text-xs font-semibold text-yellow-700">Bald fällig</div>
                        <div className="text-lg font-bold text-yellow-800">{fmtMoney(futureTotal)}</div>
                        <p className="text-[11px] text-yellow-700 mt-1">
                            Geplante Abbuchungen für diesen Monat.
                        </p>
                    </div>

                    <div className="border rounded-xl p-3 bg-green-50 border-green-200">
                        <div className="text-xs font-semibold text-green-700">Verfügbar (geschätzt)</div>
                        <div className="text-lg font-bold text-green-800">{fmtMoney(available)}</div>
                        <p className="text-[11px] text-green-700 mt-1">
                            Aktueller Bestand aller Konten minus Ausgaben & geplante Abbuchungen.
                        </p>
                    </div>
                </section>

                {/* ====== TABLE OF MONTH TRANSACTIONS ====== */}
                <section className="flex-1 flex flex-col gap-3">
                    {monthTx.length === 0 ? (
                        <div className="card bg-base-200 p-6">
                            <p className="opacity-80 text-sm mb-3">Noch keine Transaktionen in diesem Monat.</p>
                            <Button variant="primary" icon={Plus} onClick={() => navigate("/GuestTransactionOne")}>
                                Transaktion
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <input
                                    id="only-planned"
                                    type="checkbox"
                                    checked={onlyPlanned}
                                    onChange={(e) => setOnlyPlanned(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="only-planned" className="text-sm text-gray-700">
                                    Nur geplannt
                                </label>
                            </div>

                            <div className="overflow-x-auto border shadow-sm border-gray-300 rounded-xl max-h-[60vh]">
                                <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm max-h-[60vh]">
                                    <table className="w-full border-collapse table-fixed text-sm">
                                        <thead className="sticky top-0 z-10 bg-white">
                                            <tr className="text-xs text-gray-700">
                                                <th className="border border-gray-200 px-2 py-2 text-left w-[120px]">
                                                    Datum
                                                </th>
                                                <th className="border border-gray-200 px-2 py-2 text-left w-[170px]">
                                                    Konto
                                                </th>
                                                <th className="border border-gray-200 px-2 py-2 text-left w-[170px]">
                                                    Anbieter
                                                </th>
                                                <th className="border border-gray-200 px-2 py-2 text-left">Kategorie</th>
                                                <th className="border border-gray-200 px-2 py-2 text-right w-[130px]">
                                                    Betrag
                                                </th>
                                                <th className="border border-gray-200 px-2 py-2 text-left w-[220px]">
                                                    Aktion
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {tableTx.map((tx) => {
                                                const d = (tx.date ?? "").slice(0, 10);

                                                const isPlanned = tx.status === "planned";
                                                const isCancelled = tx.status === "cancelled";

                                                const isOverdue = isPlanned && d && d < todayISO;
                                                const isDueToday = isPlanned && d === todayISO;

                                                const rowClass = isCancelled
                                                    ? "bg-gray-50 text-gray-500 opacity-70"
                                                    : isOverdue
                                                        ? "bg-red-50"
                                                        : isDueToday
                                                            ? "bg-yellow-50"
                                                            : "";

                                                const amountClass = isCancelled
                                                    ? "text-gray-500 font-semibold"
                                                    : tx.kind === "income"
                                                        ? "text-green-700 font-semibold"
                                                        : "text-red-700 font-semibold";

                                                const hoverClass = rowClass ? "" : "hover:bg-gray-50";

                                                return (
                                                    <tr key={tx.id} className={`${rowClass} ${hoverClass}`}>
                                                        <td className="border border-gray-200 px-2 py-1 whitespace-nowrap align-middle">
                                                            <div className="flex items-center gap-2">
                                                                <span>{fmtDate(tx.date)}</span>

                                                                {isCancelled ? (
                                                                    <span className="text-[10px] px-2 py-[2px] rounded-full border border-gray-300 bg-gray-50 text-gray-600">
                                                                        ✖ cancelled
                                                                    </span>
                                                                ) : isPlanned ? (
                                                                    <span
                                                                        className={`text-[10px] px-2 py-[2px] rounded-full border ${isOverdue
                                                                                ? "border-red-300 bg-red-50 text-red-800"
                                                                                : isDueToday
                                                                                    ? "border-yellow-300 bg-yellow-50 text-yellow-800"
                                                                                    : "border-gray-300 bg-gray-50 text-gray-700"
                                                                            }`}
                                                                    >
                                                                        ⏳ planned
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </td>

                                                        <td className="border border-gray-200 px-2 py-1 align-middle">
                                                            <span
                                                                className="block truncate"
                                                                title={getKontoName(tx.kontoId ?? undefined)}
                                                            >
                                                                {getKontoName(tx.kontoId ?? undefined)}
                                                            </span>
                                                        </td>

                                                        <td className="border border-gray-200 px-2 py-1 align-middle">
                                                            <span
                                                                className="block truncate"
                                                                title={
                                                                    tx.kind === "expense"
                                                                        ? getAnbieterName(tx.anbieterId ?? null)
                                                                        : "—"
                                                                }
                                                            >
                                                                {tx.kind === "expense"
                                                                    ? getAnbieterName(tx.anbieterId ?? null)
                                                                    : "—"}
                                                            </span>
                                                        </td>

                                                        <td className="border border-gray-200 px-2 py-1 align-middle">
                                                            <span
                                                                className="block truncate"
                                                                title={
                                                                    tx.kind === "expense"
                                                                        ? getKategorieName(tx.gruppeId ?? null, tx.kategorieId ?? null)
                                                                        : "—"
                                                                }
                                                            >
                                                                {tx.kind === "expense"
                                                                    ? getKategorieName(tx.gruppeId ?? null, tx.kategorieId ?? null)
                                                                    : "—"}
                                                            </span>
                                                        </td>

                                                        <td
                                                            className={`border border-gray-200 px-2 py-1 text-right tabular-nums align-middle ${amountClass}`}
                                                        >
                                                            {fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}
                                                        </td>

                                                        <td className="border border-gray-200 px-2 py-1 align-middle">
                                                            {isPlanned ? (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => markBooked(tx.id)}
                                                                        className="text-xs px-2 py-1 rounded border border-green-300 bg-green-50 hover:bg-green-100"
                                                                    >
                                                                        ✅ durchführen
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => markCancelled(tx.id)}
                                                                        className="text-xs px-2 py-1 rounded border border-red-300 bg-red-50 hover:bg-red-100"
                                                                    >
                                                                        🗑 stornieren
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="py-6 flex flex-col">
                                <Button variant="primary" icon={Plus} onClick={() => navigate("/GuestTransactionOne")}>
                                    Transaktion
                                </Button>
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}
