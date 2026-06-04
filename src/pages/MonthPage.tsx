import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Settings } from "lucide-react";

import PageHeader from "../components/PageHeader";

import { EntryCard } from "../components/EntryCard";

import { useAccountsStore } from "../store/accounts";
import { useDicts } from "../store/dicts";
import { useIncomeDicts } from "../store/incomeDicts";

import { calculateMonthMetrics } from "../logic/monthMetrics";

import MetricCard from "../components/MetricCard";

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
    return Number.isNaN(d.getTime())
        ? "—"
        : new Intl.DateTimeFormat("de-DE").format(d);
}

function addMonths(base: Date, delta: number) {
    return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function monthPrefix(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelDE(d: Date) {
    return new Intl.DateTimeFormat("de-DE", {
        month: "long",
        year: "numeric",
    }).format(d);
}


export default function MonthPage() {
    const navigate = useNavigate();
    const todayISO = new Date().toISOString().slice(0, 10);

    const {
        transactions,
        getTotalBalance,
        updateTransaction,
        removeTransaction,
        addTransaction,
        accounts,
        loaded,
        loadFromSupabase,
    } = useAccountsStore();

    const {
        loadFromSupabase: loadDicts,
        loaded: dictsLoaded,
        gruppen,
        anbieter,
    } = useDicts();

    const {
        loadFromSupabase: loadIncomeDicts,
        loaded: incomeDictsLoaded,
        categories: incomeCategories,
        sources: incomeSources,
    } = useIncomeDicts();

    useEffect(() => {
        if (!loaded) void loadFromSupabase();
        if (!dictsLoaded) void loadDicts();
        if (!incomeDictsLoaded) void loadIncomeDicts();
    }, [
        loaded,
        dictsLoaded,
        incomeDictsLoaded,
        loadFromSupabase,
        loadDicts,
        loadIncomeDicts,
    ]);

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const [showPlannedOnly, setShowPlannedOnly] = useState(false);
    const [showCancelledOnly, setShowCancelledOnly] = useState(false);


    const [sortMode, setSortMode] = useState<
        "date-desc" | "date-asc" | "amount-desc" | "amount-asc"
    >("date-desc");

    const totalBalance = getTotalBalance();

    const selectedMonthPrefix = useMemo(
        () => monthPrefix(selectedMonth),
        [selectedMonth]
    );

    const selectedMonthLabel = useMemo(
        () => monthLabelDE(selectedMonth),
        [selectedMonth]
    );

    const goPrevMonth = () => setSelectedMonth((m) => addMonths(m, -1));
    const goNextMonth = () => setSelectedMonth((m) => addMonths(m, 1));
    const goThisMonth = () => {
        const d = new Date();
        setSelectedMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    };

    const getKontoName = (id?: string | null) =>
        accounts.find((a) => a.id === id)?.name ?? id ?? "—";

    const getAnbieterName = (id?: string | null) =>
        anbieter.find((a) => a.id === id)?.name ?? id ?? "—";

    const getGruppeName = (id?: string | null) =>
        gruppen.find((g) => g.id === id)?.name ?? "—";

    const getIncomeSourceName = (id?: string | null) =>
        incomeSources.find((s) => s.id === id)?.name ?? id ?? "—";

    const getIncomeCategoryName = (id?: string | null) =>
        incomeCategories.find((c) => c.id === id)?.name ?? id ?? "—";

    const markBooked = (id: string) => updateTransaction(id, { status: "booked" });

    const markCancelled = (id: string) =>
        updateTransaction(id, { status: "cancelled" });

    const restoreTransaction = (id: string) =>
        updateTransaction(id, { status: "planned" });

    const planNextMonth = (tx: any) => {
        const nextDate = new Date(tx.date);

        nextDate.setMonth(nextDate.getMonth() + 1);

        addTransaction({
            ...tx,
            id: crypto.randomUUID(),
            date: nextDate.toISOString().slice(0, 10),
            status: "planned",
            createdAt: new Date().toISOString(),
        });
    };




    const {
        monthTx,
        expenseTotal,
        plannedExpenseTotal,
        plannedIncomeTotal,
        monthEndForecast,
    } = useMemo(
        () => calculateMonthMetrics(transactions, selectedMonthPrefix, totalBalance),
        [transactions, selectedMonthPrefix, totalBalance]
    );


    const DEFAULT_VISIBLE_COLS = {
        date: true,
        konto: false,
        source: true,
        category: false,
        amount: true,
        actions: true,
        status: true,
    };

    const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE_COLS);

    const tableTx = useMemo(() => {
        let list = [...monthTx];

        if (showCancelledOnly) {
            list = list.filter((tx) => tx.status === "cancelled");
        } else {
            list = list.filter((tx) => tx.status !== "cancelled");

            if (showPlannedOnly) {
                list = list.filter((tx) => tx.status === "planned");
            }
        }

        return list.sort((a, b) => {
            if (sortMode === "date-desc") {
                return String(b.date ?? "").localeCompare(String(a.date ?? ""));
            }

            if (sortMode === "date-asc") {
                return String(a.date ?? "").localeCompare(String(b.date ?? ""));
            }

            if (sortMode === "amount-desc") {
                return (b.amount ?? 0) - (a.amount ?? 0);
            }

            if (sortMode === "amount-asc") {
                return (a.amount ?? 0) - (b.amount ?? 0);
            }

            return 0;
        });
    }, [monthTx, showPlannedOnly, showCancelledOnly, sortMode]);


    function toggleCol(key: keyof typeof visibleCols) {
        setVisibleCols((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    }

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
                <PageHeader
                    left={
                        <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                Gesamtstand
                            </div>
                            <div
                                className="truncate text-base font-semibold tabular-nums tracking-tight text-gray-900 sm:text-lg"
                                title={fmtMoney(totalBalance)}
                            >
                                {fmtMoney(totalBalance)}
                            </div>
                        </div>
                    }
                    center={
                        <div className="flex min-w-0 items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={goPrevMonth}
                                className="border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
                            >
                                ‹
                            </button>

                            <div className="flex min-w-0 flex-col items-center leading-tight">
                                <h1 className="text-sm font-semibold tracking-tight text-gray-800 whitespace-nowrap">
                                    {selectedMonthLabel}
                                </h1>
                                <button
                                    type="button"
                                    onClick={goThisMonth}
                                    className="text-[11px] text-gray-500 underline underline-offset-2 hover:text-gray-700"
                                >
                                    Dieser Monat
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={goNextMonth}
                                className="border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
                            >
                                ›
                            </button>
                        </div>
                    }
                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group inline-flex items-center justify-center p-2 text-gray-600 transition"
                        >
                            <Settings className="h-6 w-6 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />

                <section className="flex flex-col gap-2">
                    <MetricCard
                        title="Was dir bleibt"
                        value={fmtMoney(monthEndForecast)}
                        hint="Mit geplanten Ausgaben"
                        tone="green"
                        featured
                    />

                    <MetricCard
                        title="Geplante Einnahmen"
                        value={fmtMoney(plannedIncomeTotal)}
                        hint="Noch nicht gebucht"
                        tone="neutral"
                    />

                    <MetricCard
                        title="Bald fällig"
                        value={fmtMoney(plannedExpenseTotal)}
                        hint="Geplante Ausgaben"
                        tone="yellow"
                    />

                    <MetricCard
                        title="Bereits ausgegeben"
                        value={fmtMoney(expenseTotal)}
                        hint="Ausgaben in diesem Monat"
                        tone="red"
                    />
                </section>
                <Link to="/analytics" className="btn btn-outline">
                    Analytik öffnen
                </Link>
                <section className="flex flex-1 flex-col gap-2">
                    {monthTx.length === 0 ? (
                        <div className="w-full space-y-4 border border-gray-300 bg-white p-4">
                            <h2 className="text-base font-semibold text-gray-900">
                                Noch keine Transaktionen in diesem Monat
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Starte mit deiner ersten Ausgabe oder Einnahme.
                            </p>

                            <div className="mt-4 w-full space-y-4">
                                <EntryCard
                                    to="/GuestTransactionOne"
                                    title="Neue Ausgabe"
                                    subtitle="Geld ausgeben"
                                    Icon={Minus}
                                    theme="expense"
                                />
                                <EntryCard
                                    to="/income-transaction"
                                    title="Neue Einnahme"
                                    subtitle="Geld erhalten"
                                    Icon={Plus}
                                    theme="income"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-2">
                                <div className="w-full space-y-4">
                                    <EntryCard
                                        to="/GuestTransactionOne"
                                        title="Geld ausgeben"
                                        subtitle=""
                                        Icon={Minus}
                                        theme="expense"
                                    />
                                    <EntryCard
                                        to="/income-transaction"
                                        title="Geld erhalten"
                                        subtitle=""
                                        Icon={Plus}
                                        theme="income"
                                    />
                                </div>
                            </div>


                            {/*      <div className="flex flex-col gap-3 border border-gray-300 bg-white p-3 sm:flex-row sm:items-end sm:justify-between">
                                <div className="flex min-w-0 items-center gap-2">
                                    <input
                                        id="only-planned"
                                        type="checkbox"
                                        checked={onlyPlanned}
                                        onChange={(e) => setOnlyPlanned(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <label htmlFor="only-planned" className="text-sm text-gray-700">
                                        Nur geplant
                                    </label>
                                </div>
                                <div className="flex min-w-0 items-center gap-2">
                                    <input
                                        id="show-cancelled"
                                        type="checkbox"
                                        checked={showCancelled}
                                        onChange={(e) => setShowCancelled(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <label
                                        htmlFor="show-cancelled"
                                        className="text-sm text-gray-700"
                                    >
                                        Stornierte anzeigen
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">
                                            Status
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                            className="border border-gray-300 bg-white px-2 py-2 sm:px-3 sm:py-3 text-sm"
                                        >
                                            <option value="all">Alle</option>
                                            <option value="planned">Geplant</option>
                                            <option value="booked">Gebucht</option>
                                            <option value="cancelled">Storniert</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">
                                            Sortierung
                                        </label>
                                        <select
                                            value={sortMode}
                                            onChange={(e) => setSortMode(e.target.value as any)}
                                            className="border border-gray-300 bg-white px-2 py-2 sm:px-3 sm:py-3 text-sm"
                                        >
                                            <option value="date-desc">Datum: neu zuerst</option>
                                            <option value="date-asc">Datum: alt zuerst</option>
                                            <option value="amount-desc">Betrag: hoch zuerst</option>
                                            <option value="amount-asc">Betrag: niedrig zuerst</option>
                                        </select>
                                    </div>
                                </div>
                            </div> */}


                            <details className="border border-gray-300 bg-white p-3">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                                    Anzeigeoptionen
                                </summary>

                                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            autoComplete="off"
                                            id="only-planned"
                                            type="checkbox"
                                            checked={showPlannedOnly}
                                            onChange={(e) => setShowPlannedOnly(e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        Geplante
                                    </label>

                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            autoComplete="off"
                                            id="only-cancelled"
                                            type="checkbox"
                                            checked={showCancelledOnly}
                                            onChange={(e) => setShowCancelledOnly(e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        Stornierte
                                    </label>

                                    {/*
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">
                                            Status
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                            className="border border-gray-300 bg-white px-2 py-2 text-sm"
                                        >
                                            <option value="all">Alle</option>
                                            <option value="planned">Geplant</option>
                                            <option value="booked">Gebucht</option>
                                            <option value="cancelled">Storniert</option>
                                        </select>
                                    </div>
*/}
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">
                                            Sortierung
                                        </label>
                                        <select
                                            value={sortMode}
                                            onChange={(e) => setSortMode(e.target.value as any)}
                                            className="border border-gray-300 bg-white px-2 py-2 text-sm"
                                        >
                                            <option value="date-desc">Datum: neu zuerst</option>
                                            <option value="date-asc">Datum: alt zuerst</option>
                                            <option value="amount-desc">Betrag: hoch zuerst</option>
                                            <option value="amount-asc">Betrag: niedrig zuerst</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-gray-200 pt-3">
                                    <div className="mb-2 text-[11px] uppercase tracking-wide text-gray-500">
                                        Spalten
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            ["date", "Datum"],
                                            ["konto", "Konto"],
                                            ["source", "Anbieter / Quelle"],
                                            ["category", "Gruppe / Kategorie"],
                                            ["amount", "Betrag"],
                                            ["actions", "Aktion"],
                                            ["status", "Status"],
                                        ].map(([key, label]) => (
                                            <label
                                                key={key}
                                                className="flex items-center gap-2 text-sm text-gray-700"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={visibleCols[key as keyof typeof visibleCols]}
                                                    onChange={() => toggleCol(key as keyof typeof visibleCols)}
                                                    className="h-4 w-4"
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </details>


                            <div className="max-h-[620px] overflow-auto border border-gray-300 bg-white touch-pan-x touch-pan-y">
                                <table className="w-full table-fixed border-collapse text-[11px] sm:text-xs">
                                    <thead className="sticky top-0 z-10 bg-gray-50">
                                        <tr>
                                            {visibleCols.date && (<th className="w-[92px] border-b border-gray-300 px-2 py-2 sm:px-3 sm:py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Datum
                                            </th>)}

                                            {visibleCols.status && (
                                                <th className="w-[110px] border-b border-gray-300 px-2 py-2 sm:px-3 sm:py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                    Status
                                                </th>
                                            )}

                                            {visibleCols.konto && (<th className="w-[120px] border-b border-gray-300 px-2 py-2 sm:px-3 sm:py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Konto
                                            </th>)}

                                            {visibleCols.source && (<th className="w-[150px] border-b border-gray-300 px-2 py-2 sm:px-3 sm:py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Anbieter / Quelle
                                            </th>)}

                                            {visibleCols.category && (<th className="w-[150px] border-b border-gray-300 px-2 py-2 sm:px-3 sm:py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Gruppe / Kategorie
                                            </th>)}

                                            {visibleCols.amount && (<th className="w-[120px] border-b border-gray-300 px-2 py-2 sm:px-3 sm:py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Betrag
                                            </th>)}

                                            {visibleCols.actions && (<th className="w-[220px] border-b border-gray-300 px-2 py-2 sm:px-3 sm:py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Aktion
                                            </th>)}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {tableTx.map((tx) => {
                                            const d = (tx.date ?? "").slice(0, 10);
                                            const isPlanned = tx.status === "planned";
                                            const isCancelled = tx.status === "cancelled";
                                            const isOverdue = isPlanned && d < todayISO;
                                            const isDueToday = isPlanned && d === todayISO;

                                            const rowClass = isCancelled
                                                ? "bg-gray-50 text-gray-500"
                                                : isOverdue
                                                    ? "bg-red-50"
                                                    : isDueToday
                                                        ? "bg-yellow-50"
                                                        : "hover:bg-gray-50";

                                            const amountClass = isCancelled
                                                ? "text-gray-500 font-semibold"
                                                : tx.kind === "income"
                                                    ? "text-green-700 font-semibold"
                                                    : "text-red-700 font-semibold";

                                            const cancelSeries = (seriesId: string) => {
                                                transactions
                                                    .filter((tx) => tx.recurringSeriesId === seriesId)
                                                    .forEach((tx) => updateTransaction(tx.id, { status: "cancelled" }));
                                            };

                                            const restoreSeries = (seriesId: string) => {
                                                transactions
                                                    .filter((tx) => tx.recurringSeriesId === seriesId)
                                                    .forEach((tx) => updateTransaction(tx.id, { status: "planned" }));
                                            };


                                            return (
                                                <tr key={tx.id} className={rowClass}>

                                                    {visibleCols.date && (
                                                        <td className="border-b border-gray-200 px-2 py-2 sm:px-3 sm:py-3 align-middle">
                                                            {fmtDate(tx.date)}
                                                        </td>
                                                    )}

                                                    {visibleCols.status && (
                                                        <td className="border-b border-gray-200 px-2 py-2 sm:px-3 sm:py-3 align-middle">
                                                            {isCancelled ? (
                                                                <span className="border border-gray-300 px-2 py-[1px] text-[10px] text-gray-600">
                                                                    storniert
                                                                </span>
                                                            ) : isPlanned ? (
                                                                <span
                                                                    className={`border px-2 py-[1px] text-[10px] ${isOverdue
                                                                        ? "border-red-300 text-red-700"
                                                                        : isDueToday
                                                                            ? "border-yellow-400 text-yellow-700"
                                                                            : "border-gray-300 text-gray-600"
                                                                        }`}
                                                                >
                                                                    geplant
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-green-700">
                                                                    gebucht
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}

                                                    {visibleCols.konto && (
                                                        <td className="min-w-0 border-b border-gray-200 px-2 py-2 sm:px-3 sm:py-3 align-middle">
                                                            <span
                                                                className="block truncate"
                                                                title={getKontoName((tx as any).kontoId)}
                                                            >
                                                                {getKontoName((tx as any).kontoId)}
                                                            </span>
                                                        </td>
                                                    )}

                                                    {visibleCols.source && (
                                                        <td className="min-w-0 border-b border-gray-200 px-2 py-2 sm:px-3 sm:py-3 align-middle">
                                                            <span
                                                                className="block truncate"
                                                                title={
                                                                    tx.kind === "expense"
                                                                        ? getAnbieterName((tx as any).anbieterId)
                                                                        : getIncomeSourceName((tx as any).quelleId)
                                                                }
                                                            >
                                                                {tx.kind === "expense"
                                                                    ? getAnbieterName((tx as any).anbieterId)
                                                                    : getIncomeSourceName((tx as any).quelleId)}
                                                            </span>
                                                        </td>)}

                                                    {visibleCols.category && (
                                                        <td className="min-w-0 border-b border-gray-200 px-2 py-2 sm:px-3 sm:py-3 align-middle">
                                                            <span
                                                                className="block truncate"
                                                                title={
                                                                    tx.kind === "expense"
                                                                        ? getGruppeName((tx as any).gruppeId)
                                                                        : getIncomeCategoryName((tx as any).incomeKategorieId)
                                                                }
                                                            >
                                                                {tx.kind === "expense"
                                                                    ? getGruppeName((tx as any).gruppeId)
                                                                    : getIncomeCategoryName((tx as any).incomeKategorieId)}
                                                            </span>
                                                        </td>)}

                                                    {visibleCols.amount && (
                                                        <td
                                                            className={`border-b border-gray-200 px-2 py-2 text-right text-[11px] sm:text-xs tabular-nums align-middle ${amountClass}`}

                                                            title={fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}
                                                        >
                                                            {fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}
                                                        </td>)}


                                                    {visibleCols.actions && (
                                                        <td className="border-b border-gray-200 px-2 py-2 sm:px-3 sm:py-3 align-middle">
                                                            {isPlanned ? (
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                tx.kind === "income"
                                                                                    ? `/income-transaction/${tx.id}/edit`
                                                                                    : `/transaction/${tx.id}/edit`
                                                                            )
                                                                        }
                                                                        className="border border-gray-300 px-2 py-1 text-[10px] sm:text-xs hover:bg-gray-50"
                                                                    >
                                                                        bearbeiten
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => markBooked(tx.id)}
                                                                        className="border border-gray-300 px-2 py-1 text-[10px] sm:text-xs hover:bg-gray-50"
                                                                    >
                                                                        durchführen
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => markCancelled(tx.id)}
                                                                        className="border border-gray-300 px-2 py-1 text-[10px] sm:text-xs hover:bg-gray-50"
                                                                    >
                                                                        stornieren
                                                                    </button>
                                                                    {tx.recurringSeriesId && !isCancelled && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => cancelSeries(tx.recurringSeriesId!)}
                                                                            className="border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                                        >
                                                                            Serie stornieren
                                                                        </button>
                                                                    )}
                                                                    {tx.recurringSeriesId && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => restoreSeries(tx.recurringSeriesId!)}
                                                                            className="border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                                        >
                                                                            Serie wiederherstellen
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => planNextMonth(tx)}
                                                                        className="border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                                    >
                                                                        nächster Monat
                                                                    </button>


                                                                </div>
                                                            ) : isCancelled ? (
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => restoreTransaction(tx.id)}
                                                                        className="border border-gray-300 px-2 py-1 text-[10px] sm:text-xs hover:bg-gray-50"
                                                                    >
                                                                        wiederherstellen
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                tx.kind === "income"
                                                                                    ? `/income-transaction/${tx.id}/edit`
                                                                                    : `/transaction/${tx.id}/edit`
                                                                            )
                                                                        }
                                                                        className="border border-gray-300 px-2 py-1 text-[10px] sm:text-xs hover:bg-gray-50"
                                                                    >
                                                                        bearbeiten
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                tx.kind === "income"
                                                                                    ? `/income-transaction/${tx.id}/edit`
                                                                                    : `/transaction/${tx.id}/edit`
                                                                            )
                                                                        }
                                                                        className="border border-gray-300 px-2 py-1 text-[10px] sm:text-xs hover:bg-gray-50"
                                                                    >
                                                                        bearbeiten
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        /*    onClick={() => {
                                                                                if (window.confirm("Transaktion wirklich löschen?")) {
                                                                                    removeTransaction(tx.id);
                                                                                } 
                                                                            }} */

                                                                        onClick={() => markCancelled(tx.id)}


                                                                        className="border border-gray-300 px-2 py-1 text-[10px] sm:text-xs hover:bg-gray-50"
                                                                    >
                                                                        stornieren
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => planNextMonth(tx)}
                                                                        className="border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                                    >
                                                                        nächster Monat
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>)}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </section>
            </main >
        </div >
    );
}