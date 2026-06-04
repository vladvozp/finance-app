import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";

import { useAccountsStore } from "../store/accounts";
import { useDicts } from "../store/dicts";
import { useIncomeDicts } from "../store/incomeDicts";

function fmtMoney(n: number) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(n);
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

export default function Analytics() {
    const {
        transactions,
        getTotalBalance,
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

    const totalBalance = getTotalBalance();

    const getAnbieterName = (id?: string | null) =>
        anbieter.find((a) => a.id === id)?.name ?? id ?? "—";

    const getGruppeName = (id?: string | null) =>
        gruppen.find((g) => g.id === id)?.name ?? id ?? "—";

    const getIncomeSourceName = (id?: string | null) =>
        incomeSources.find((s) => s.id === id)?.name ?? id ?? "—";

    const getIncomeCategoryName = (id?: string | null) =>
        incomeCategories.find((c) => c.id === id)?.name ?? id ?? "—";

    const monthTx = useMemo(() => {
        return transactions.filter((tx) =>
            String(tx.date ?? "").startsWith(selectedMonthPrefix)
        );
    }, [transactions, selectedMonthPrefix]);

    const activeTx = useMemo(() => {
        return monthTx.filter((tx) => tx.status !== "cancelled");
    }, [monthTx]);

    const expenses = useMemo(() => {
        return activeTx.filter((tx) => tx.kind === "expense");
    }, [activeTx]);

    const incomes = useMemo(() => {
        return activeTx.filter((tx) => tx.kind === "income");
    }, [activeTx]);

    const expenseTotal = useMemo(() => {
        return expenses.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
    }, [expenses]);

    const incomeTotal = useMemo(() => {
        return incomes.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
    }, [incomes]);

    const result = incomeTotal - expenseTotal;

    const plannedExpenses = useMemo(() => {
        return expenses
            .filter((tx) => tx.status === "planned")
            .reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
    }, [expenses]);

    const bookedExpenses = useMemo(() => {
        return expenses
            .filter((tx) => tx.status === "booked")
            .reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
    }, [expenses]);

    const byGroup = useMemo(() => {
        const map = new Map<string, number>();

        for (const tx of expenses) {
            const key = (tx as any).gruppeId ?? "unknown";
            map.set(key, (map.get(key) ?? 0) + (tx.amount ?? 0));
        }

        return [...map.entries()]
            .map(([id, amount]) => ({
                id,
                name: getGruppeName(id),
                amount,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [expenses, gruppen]);

    const byAnbieter = useMemo(() => {
        const map = new Map<string, number>();

        for (const tx of expenses) {
            const key = (tx as any).anbieterId ?? "unknown";
            map.set(key, (map.get(key) ?? 0) + (tx.amount ?? 0));
        }

        return [...map.entries()]
            .map(([id, amount]) => ({
                id,
                name: getAnbieterName(id),
                amount,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [expenses, anbieter]);

    const byIncomeSource = useMemo(() => {
        const map = new Map<string, number>();

        for (const tx of incomes) {
            const key = (tx as any).quelleId ?? "unknown";
            map.set(key, (map.get(key) ?? 0) + (tx.amount ?? 0));
        }

        return [...map.entries()]
            .map(([id, amount]) => ({
                id,
                name: getIncomeSourceName(id),
                amount,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [incomes, incomeSources]);

    const byIncomeCategory = useMemo(() => {
        const map = new Map<string, number>();

        for (const tx of incomes) {
            const key = (tx as any).incomeKategorieId ?? "unknown";
            map.set(key, (map.get(key) ?? 0) + (tx.amount ?? 0));
        }

        return [...map.entries()]
            .map(([id, amount]) => ({
                id,
                name: getIncomeCategoryName(id),
                amount,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [incomes, incomeCategories]);

    const topExpenses = useMemo(() => {
        return [...expenses]
            .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
            .slice(0, 10);
    }, [expenses]);

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
                <PageHeader
                    left={
                        <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                Gesamtstand
                            </div>
                            <div className="truncate text-base font-semibold tabular-nums tracking-tight text-gray-900 sm:text-lg">
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
                                    Analytik · {selectedMonthLabel}
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
                        title="Ergebnis"
                        value={fmtMoney(result)}
                        hint="Einnahmen minus Ausgaben"
                        tone={result >= 0 ? "green" : "red"}
                        featured
                    />

                    <MetricCard
                        title="Einnahmen"
                        value={fmtMoney(incomeTotal)}
                        hint="Aktive Einnahmen im Monat"
                        tone="green"
                    />

                    <MetricCard
                        title="Ausgaben"
                        value={fmtMoney(expenseTotal)}
                        hint="Aktive Ausgaben im Monat"
                        tone="red"
                    />

                    <MetricCard
                        title="Geplant / Gebucht"
                        value={`${fmtMoney(plannedExpenses)} / ${fmtMoney(bookedExpenses)}`}
                        hint="Offene und bereits gebuchte Ausgaben"
                        tone="yellow"
                    />
                </section>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="border border-gray-300 bg-white p-4">
                        <h2 className="mb-3 text-base font-semibold text-gray-900">
                            Ausgaben nach Gruppen
                        </h2>

                        {byGroup.length === 0 ? (
                            <p className="text-sm text-gray-500">Keine Ausgaben.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <tbody>
                                    {byGroup.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{row.name}</td>
                                            <td className="py-2 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="border border-gray-300 bg-white p-4">
                        <h2 className="mb-3 text-base font-semibold text-gray-900">
                            Ausgaben nach Anbieter
                        </h2>

                        {byAnbieter.length === 0 ? (
                            <p className="text-sm text-gray-500">Keine Ausgaben.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <tbody>
                                    {byAnbieter.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{row.name}</td>
                                            <td className="py-2 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="border border-gray-300 bg-white p-4">
                        <h2 className="mb-3 text-base font-semibold text-gray-900">
                            Einnahmen nach Quelle
                        </h2>

                        {byIncomeSource.length === 0 ? (
                            <p className="text-sm text-gray-500">Keine Einnahmen.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <tbody>
                                    {byIncomeSource.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{row.name}</td>
                                            <td className="py-2 text-right font-semibold tabular-nums text-green-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="border border-gray-300 bg-white p-4">
                        <h2 className="mb-3 text-base font-semibold text-gray-900">
                            Einnahmen nach Kategorie
                        </h2>

                        {byIncomeCategory.length === 0 ? (
                            <p className="text-sm text-gray-500">Keine Einnahmen.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <tbody>
                                    {byIncomeCategory.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{row.name}</td>
                                            <td className="py-2 text-right font-semibold tabular-nums text-green-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                <section className="border border-gray-300 bg-white p-4">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">
                        Top 10 Ausgaben
                    </h2>

                    {topExpenses.length === 0 ? (
                        <p className="text-sm text-gray-500">Keine Ausgaben.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed border-collapse text-[11px] sm:text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-[100px] border-b border-gray-300 px-2 py-2 text-left uppercase tracking-wide text-gray-600">
                                            Datum
                                        </th>
                                        <th className="w-[160px] border-b border-gray-300 px-2 py-2 text-left uppercase tracking-wide text-gray-600">
                                            Anbieter
                                        </th>
                                        <th className="w-[160px] border-b border-gray-300 px-2 py-2 text-left uppercase tracking-wide text-gray-600">
                                            Gruppe
                                        </th>
                                        <th className="w-[120px] border-b border-gray-300 px-2 py-2 text-right uppercase tracking-wide text-gray-600">
                                            Betrag
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {topExpenses.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50">
                                            <td className="border-b border-gray-200 px-2 py-2">
                                                {String(tx.date ?? "").slice(0, 10)}
                                            </td>
                                            <td className="border-b border-gray-200 px-2 py-2">
                                                {getAnbieterName((tx as any).anbieterId)}
                                            </td>
                                            <td className="border-b border-gray-200 px-2 py-2">
                                                {getGruppeName((tx as any).gruppeId)}
                                            </td>
                                            <td className="border-b border-gray-200 px-2 py-2 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(tx.amount ?? 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}