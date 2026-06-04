import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

import PageHeader from "../components/PageHeader";

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
    const { transactions, getTotalBalance, loaded, loadFromSupabase } =
        useAccountsStore();

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

    const totalBalance = getTotalBalance();

    const goPrevMonth = () => setSelectedMonth((m) => addMonths(m, -1));
    const goNextMonth = () => setSelectedMonth((m) => addMonths(m, 1));

    const goThisMonth = () => {
        const d = new Date();
        setSelectedMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    };

    const getAnbieterName = (id?: string | null) =>
        anbieter.find((a: any) => a.id === id)?.name ?? id ?? "—";

    const getGruppeName = (id?: string | null) =>
        gruppen.find((g: any) => g.id === id)?.name ?? id ?? "—";

    const getIncomeSourceName = (id?: string | null) =>
        incomeSources.find((s: any) => s.id === id)?.name ?? id ?? "—";

    const getIncomeCategoryName = (id?: string | null) =>
        incomeCategories.find((c: any) => c.id === id)?.name ?? id ?? "—";

    const expenseCategories = useMemo(() => {
        const result: any[] = [];

        for (const group of gruppen as any[]) {
            const list =
                group.categories ??
                group.kategorien ??
                group.children ??
                group.items ??
                [];

            for (const category of list) {
                result.push({
                    ...category,
                    gruppeId: category.gruppeId ?? category.groupId ?? group.id,
                    gruppeName: group.name,
                });
            }
        }

        return result;
    }, [gruppen]);

    const getKategorieName = (id?: string | null) =>
        expenseCategories.find((c: any) => c.id === id)?.name ?? id ?? "—";

    const monthTx = useMemo(() => {
        return transactions.filter((tx: any) =>
            String(tx.date ?? "").startsWith(selectedMonthPrefix)
        );
    }, [transactions, selectedMonthPrefix]);

    const activeTx = useMemo(() => {
        return monthTx.filter((tx: any) => tx.status !== "cancelled");
    }, [monthTx]);

    const expenses = useMemo(() => {
        return activeTx.filter((tx: any) => tx.kind === "expense");
    }, [activeTx]);

    const incomes = useMemo(() => {
        return activeTx.filter((tx: any) => tx.kind === "income");
    }, [activeTx]);

    const byGroup = useMemo(() => {
        const map = new Map<string, number>();

        for (const group of gruppen as any[]) {
            map.set(group.id, 0);
        }

        for (const tx of expenses as any[]) {
            const key = tx.gruppeId ?? "unknown";
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

    const byCategory = useMemo(() => {
        const map = new Map<string, number>();

        for (const category of expenseCategories as any[]) {
            map.set(category.id, 0);
        }

        for (const tx of expenses as any[]) {
            const key = tx.kategorieId ?? "unknown";
            map.set(key, (map.get(key) ?? 0) + (tx.amount ?? 0));
        }

        return [...map.entries()]
            .map(([id, amount]) => ({
                id,
                name: getKategorieName(id),
                amount,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [expenses, expenseCategories]);

    const byAnbieter = useMemo(() => {
        const map = new Map<string, number>();

        for (const item of anbieter as any[]) {
            map.set(item.id, 0);
        }

        for (const tx of expenses as any[]) {
            const key = tx.anbieterId ?? "unknown";
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

        for (const item of incomeSources as any[]) {
            map.set(item.id, 0);
        }

        for (const tx of incomes as any[]) {
            const key = tx.quelleId ?? "unknown";
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

        for (const item of incomeCategories as any[]) {
            map.set(item.id, 0);
        }

        for (const tx of incomes as any[]) {
            const key = tx.incomeKategorieId ?? "unknown";
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
            .sort((a: any, b: any) => (b.amount ?? 0) - (a.amount ?? 0))
            .slice(0, 10);
    }, [expenses]);

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6">
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

                <section className="flex flex-col gap-8">
                    <section className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Ausgabenanalyse
                            </h2>
                            <p className="text-sm text-gray-500">
                                Analyse der Ausgaben im ausgewählten Monat.
                            </p>
                        </div>

                        <div className="border border-gray-300 bg-white p-4 overflow-x-auto">
                            <h3 className="mb-3 text-base font-semibold text-gray-900">
                                Ausgaben nach Gruppen
                            </h3>

                            <table className="w-full min-w-[500px] text-sm">
                                <tbody>
                                    {byGroup.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{row.name}</td>
                                            <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border border-gray-300 bg-white p-4 overflow-x-auto">
                            <h3 className="mb-3 text-base font-semibold text-gray-900">
                                Ausgaben nach Kategorien
                            </h3>

                            <table className="w-full min-w-[500px] text-sm">
                                <tbody>
                                    {byCategory.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{row.name}</td>
                                            <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border border-gray-300 bg-white p-4 overflow-x-auto">
                            <h3 className="mb-3 text-base font-semibold text-gray-900">
                                Größte Anbieter
                            </h3>

                            <table className="w-full min-w-[500px] text-sm">
                                <tbody>
                                    {byAnbieter.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{row.name}</td>
                                            <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Einnahmenanalyse
                            </h2>
                            <p className="text-sm text-gray-500">
                                Analyse der Einnahmen im ausgewählten Monat.
                            </p>
                        </div>

                        <div className="border border-gray-300 bg-white p-4 overflow-x-auto">
                            <h3 className="mb-3 text-base font-semibold text-gray-900">
                                Einnahmequellen
                            </h3>

                            <table className="w-full min-w-[500px] text-sm">
                                <tbody>
                                    {byIncomeSource.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{row.name}</td>
                                            <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-green-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border border-gray-300 bg-white p-4 overflow-x-auto">
                            <h3 className="mb-3 text-base font-semibold text-gray-900">
                                Einnahmekategorien
                            </h3>

                            <table className="w-full min-w-[500px] text-sm">
                                <tbody>
                                    {byIncomeCategory.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{row.name}</td>
                                            <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-green-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="border border-gray-300 bg-white p-4 overflow-x-auto">
                        <h2 className="mb-3 text-base font-semibold text-gray-900">
                            Top 10 Ausgaben
                        </h2>

                        {topExpenses.length === 0 ? (
                            <p className="text-sm text-gray-500">Keine Ausgaben.</p>
                        ) : (
                            <table className="w-full min-w-[600px] table-fixed border-collapse text-[11px] sm:text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-[100px] border-b border-gray-300 px-2 py-2 text-left uppercase tracking-wide text-gray-600">
                                            Datum
                                        </th>
                                        <th className="w-[180px] border-b border-gray-300 px-2 py-2 text-left uppercase tracking-wide text-gray-600">
                                            Anbieter
                                        </th>
                                        <th className="w-[180px] border-b border-gray-300 px-2 py-2 text-left uppercase tracking-wide text-gray-600">
                                            Gruppe
                                        </th>
                                        <th className="w-[140px] border-b border-gray-300 px-2 py-2 text-right uppercase tracking-wide text-gray-600">
                                            Betrag
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {topExpenses.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-gray-50">
                                            <td className="border-b border-gray-200 px-2 py-2">
                                                {String(tx.date ?? "").slice(0, 10)}
                                            </td>
                                            <td className="border-b border-gray-200 px-2 py-2">
                                                {getAnbieterName(tx.anbieterId)}
                                            </td>
                                            <td className="border-b border-gray-200 px-2 py-2">
                                                {getGruppeName(tx.gruppeId)}
                                            </td>
                                            <td className="whitespace-nowrap border-b border-gray-200 px-2 py-2 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(tx.amount ?? 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>
                </section>
            </main>
        </div>
    );
}