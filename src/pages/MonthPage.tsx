// src/pages/MonthPage.tsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { MoveLeft, Plus, Settings } from "lucide-react";

import type { Tx } from "../types/tx";
import { useAccountsStore } from "../store/accounts";
import { useDicts } from "../store/dicts";

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
        return new Intl.DateTimeFormat("de-DE").format(new Date(y, m - 1, d));
    }
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("de-DE").format(d);
}

function addMonths(base: Date, delta: number) {
    return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}
function monthPrefix(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabelDE(d: Date) {
    return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(d);
}

export default function MonthPage() {
    const navigate = useNavigate();
    const todayISO = new Date().toISOString().slice(0, 10);

    // Store
    const { accounts, transactions, getTotalBalance, updateTransaction } = useAccountsStore();
    const totalBalance = getTotalBalance();


    // Month navigation
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [onlyPlanned, setOnlyPlanned] = useState(false);

    const selectedMonthPrefix = useMemo(() => monthPrefix(selectedMonth), [selectedMonth]);
    const selectedMonthLabel = useMemo(() => monthLabelDE(selectedMonth), [selectedMonth]);

    const goPrevMonth = () => setSelectedMonth((m) => addMonths(m, -1));
    const goNextMonth = () => setSelectedMonth((m) => addMonths(m, +1));
    const goThisMonth = () => {
        const d = new Date();
        setSelectedMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    };

    // Dicts
    const { kategorien, anbieter } = useDicts();


    const getKontoName = (id?: string) =>
        accounts.find((a) => a.id === id)?.name ?? id ?? "—";
    const getAnbieterName = (id?: string | null) =>
        anbieter.find((a) => a.id === id)?.name ?? id ?? "—";
    const getKategorieName = (gid?: string | null, kid?: string | null) => {
        if (!kid) return "—";
        const col = kategorien[gid ?? ""] ?? [];
        return col.find((k) => k.id === kid)?.name ?? kid;
    };

    // Actions
    const markBooked = (id: string) => updateTransaction(id, { status: "booked" });
    const markCancelled = (id: string) => updateTransaction(id, { status: "cancelled" });

    // Filtering
    const monthTx = useMemo(
        () => transactions.filter((tx) => (tx.date ?? "").startsWith(selectedMonthPrefix)),
        [transactions, selectedMonthPrefix]
    );

    const monthBookedTx = useMemo(
        () => monthTx.filter((tx) => tx.status !== "planned" && tx.status !== "cancelled"),
        [monthTx]
    );

    const monthPlannedTx = useMemo(
        () => monthTx.filter((tx) => tx.status === "planned"),
        [monthTx]
    );

    const tableTx = useMemo(
        () => (onlyPlanned ? monthTx.filter((t) => t.status === "planned") : monthTx),
        [onlyPlanned, monthTx]
    );

    const expenseTotal = useMemo(
        () => monthBookedTx.reduce((sum, tx) => {
            if (tx.kind !== "expense") return sum;
            return sum + Math.abs(Number.isFinite(tx.amount) ? tx.amount : 0);
        }, 0),
        [monthBookedTx]
    );

    const futureTotal = useMemo(
        () => monthPlannedTx.reduce((sum, tx) => {
            if (tx.kind !== "expense") return sum;
            return sum + Math.abs(Number.isFinite(tx.amount) ? tx.amount : 0);
        }, 0),
        [monthPlannedTx]
    );

    const available = totalBalance - futureTotal;

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col max-w-5xl mx-auto px-4 gap-4">
                <PageHeader
                    left={
                        <Link to="/login" className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800">
                            <MoveLeft className="w-5 h-5" /> Zurück
                        </Link>
                    }
                    center={
                        <div className="flex items-center justify-center gap-3">
                            <button type="button" onClick={goPrevMonth}
                                className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">‹</button>
                            <div className="flex flex-col items-center leading-tight">
                                <h1 className="text-sm font-semibold text-gray-600">{selectedMonthLabel}</h1>
                                <button type="button" onClick={goThisMonth}
                                    className="text-xs text-gray-500 underline hover:text-gray-700">
                                    Dieser Monat
                                </button>
                            </div>
                            <button type="button" onClick={goNextMonth}
                                className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">›</button>
                        </div>
                    }
                    right={
                        <Link to="/SettingsPage" aria-label="Einstellungen"
                            className="group p-2 text-gray-600 transition inline-flex items-center justify-center">
                            <Settings className="w-5 h-5 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />

                {/* Kontostand */}
                <section className="border rounded-xl p-3 bg-white">
                    <div className="text-xs text-gray-500">Aktueller Kontostand (gesamt)</div>
                    <div className="text-xl font-bold text-gray-900">{fmtMoney(totalBalance)}</div>
                </section>

                {/* RYG Summary */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border rounded-sm p-2 bg-red-50 border-red-200">
                        <div className="text-xs font-semibold text-red-700">Bereits ausgegeben</div>
                        <div className="text-lg font-bold text-red-800">{fmtMoney(expenseTotal)}</div>
                        <p className="text-[11px] text-red-700 mt-1">Bereits gebuchte Ausgaben in diesem Monat.</p>
                    </div>
                    <div className="border rounded-sm p-2 bg-yellow-50 border-yellow-200">
                        <div className="text-xs font-semibold text-yellow-700">Bald fällig</div>
                        <div className="text-lg font-bold text-yellow-800">{fmtMoney(futureTotal)}</div>
                        <p className="text-[11px] text-yellow-700 mt-1">Geplante Abbuchungen für diesen Monat.</p>
                    </div>
                    <div className="border rounded-sm p-2 bg-green-50 border-green-200">
                        <div className="text-xs font-semibold text-green-700">Verfügbar (geschätzt)</div>
                        <div className="text-lg font-bold text-green-800">{fmtMoney(available)}</div>
                        <p className="text-[11px] text-green-700 mt-1">Gesamtbestand minus geplante Abbuchungen.</p>
                    </div>
                </section>

                {/* Transactions */}
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
                                <input id="only-planned" type="checkbox" checked={onlyPlanned}
                                    onChange={(e) => setOnlyPlanned(e.target.checked)} className="h-4 w-4" />
                                <label htmlFor="only-planned" className="text-sm text-gray-700">Nur geplannt</label>
                            </div>

                            <div className="overflow-x-auto border shadow-sm border-gray-300 rounded-xl max-h-[60vh]">
                                <table className="w-full border-collapse table-fixed text-sm">
                                    <thead className="sticky top-0 z-10 bg-white">
                                        <tr className="text-xs text-gray-700">
                                            <th className="border border-gray-200 px-2 py-2 text-left w-[120px]">Datum</th>
                                            <th className="border border-gray-200 px-2 py-2 text-left w-[170px]">Konto</th>
                                            <th className="border border-gray-200 px-2 py-2 text-left w-[170px]">Anbieter</th>
                                            <th className="border border-gray-200 px-2 py-2 text-left">Kategorie</th>
                                            <th className="border border-gray-200 px-2 py-2 text-right w-[130px]">Betrag</th>
                                            <th className="border border-gray-200 px-2 py-2 text-left w-[220px]">Aktion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableTx.map((tx) => {
                                            const d = (tx.date ?? "").slice(0, 10);
                                            const isPlanned = tx.status === "planned";
                                            const isCancelled = tx.status === "cancelled";
                                            const isOverdue = isPlanned && d < todayISO;
                                            const isDueToday = isPlanned && d === todayISO;

                                            const rowClass = isCancelled ? "bg-gray-50 text-gray-500 opacity-70"
                                                : isOverdue ? "bg-red-50"
                                                    : isDueToday ? "bg-yellow-50" : "";

                                            const amountClass = isCancelled ? "text-gray-500 font-semibold"
                                                : tx.kind === "income" ? "text-green-700 font-semibold"
                                                    : "text-red-700 font-semibold";

                                            return (
                                                <tr key={tx.id} className={`${rowClass} ${rowClass ? "" : "hover:bg-gray-50"}`}>
                                                    <td className="border border-gray-200 px-2 py-1 whitespace-nowrap align-middle">
                                                        <div className="flex items-center gap-2">
                                                            <span>{fmtDate(tx.date)}</span>
                                                            {isCancelled ? (
                                                                <span className="text-[10px] px-2 py-[2px] rounded-full border border-gray-300 bg-gray-50 text-gray-600">✖ cancelled</span>
                                                            ) : isPlanned ? (
                                                                <span className={`text-[10px] px-2 py-[2px] rounded-full border ${isOverdue ? "border-red-300 bg-red-50 text-red-800" : isDueToday ? "border-yellow-300 bg-yellow-50 text-yellow-800" : "border-gray-300 bg-gray-50 text-gray-700"}`}>
                                                                    ⏳ planned
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="border border-gray-200 px-2 py-1 align-middle">
                                                        <span className="block truncate">{getKontoName((tx as any).kontoId)}</span>
                                                    </td>
                                                    <td className="border border-gray-200 px-2 py-1 align-middle">
                                                        <span className="block truncate">{tx.kind === "expense" ? getAnbieterName((tx as any).anbieterId) : "—"}</span>
                                                    </td>
                                                    <td className="border border-gray-200 px-2 py-1 align-middle">
                                                        <span className="block truncate">{tx.kind === "expense" ? getKategorieName((tx as any).gruppeId, (tx as any).kategorieId) : "—"}</span>
                                                    </td>
                                                    <td className={`border border-gray-200 px-2 py-1 text-right tabular-nums align-middle ${amountClass}`}>
                                                        {fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}
                                                    </td>
                                                    <td className="border border-gray-200 px-2 py-1 align-middle">
                                                        {isPlanned ? (
                                                            <div className="flex items-center gap-2">
                                                                <button type="button" onClick={() => markBooked(tx.id)}
                                                                    className="text-xs px-2 py-1 rounded border border-green-300 bg-green-50 hover:bg-green-100">
                                                                    ✅ durchführen
                                                                </button>
                                                                <button type="button" onClick={() => markCancelled(tx.id)}
                                                                    className="text-xs px-2 py-1 rounded border border-red-300 bg-red-50 hover:bg-red-100">
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