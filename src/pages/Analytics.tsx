import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

import PageHeader from "../components/PageHeader";

import { useAccountsStore } from "../store/accounts";
import { useDicts, paymentTypeLabels } from "../store/dicts";
import { useIncomeDicts } from "../store/incomeDicts";

import CategoryBarChart from "../components/CategoryBarChart";

import { GroupBudgetSettings } from "../components/analytics/GroupBudgetSettings";

type AnalyticsView = "booked" | "planned" | "active";

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

function DetailsTable({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <details className="border border-gray-300 bg-white">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                {title}
            </summary>

            <div className="max-h-[430px] overflow-y-auto border-t border-gray-200">
                {children}
            </div>
        </details>
    );
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

    const [analyticsView, setAnalyticsView] =
        useState<AnalyticsView>("active");

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

    const analyticsTx = useMemo(() => {
        if (analyticsView === "booked") {
            return monthTx.filter((tx: any) => tx.status === "booked");
        }

        if (analyticsView === "planned") {
            return monthTx.filter((tx: any) => tx.status === "planned");
        }

        return monthTx.filter((tx: any) => tx.status !== "cancelled");
    }, [monthTx, analyticsView]);

    const expenses = useMemo(() => {
        return analyticsTx.filter((tx: any) => tx.kind === "expense");
    }, [analyticsTx]);

    const byPaymentType = useMemo(() => {
        const map = new Map<string, number>();

        map.set("fixed", 0);
        map.set("subscription", 0);
        map.set("installment", 0);
        map.set("normal", 0);

        for (const tx of expenses as any[]) {
            const key = tx.paymentType ?? "normal";
            map.set(key, (map.get(key) ?? 0) + Math.abs(tx.amount ?? 0));
        }

        return [
            {
                id: "fixed",
                name: "Fixkosten",
                amount: map.get("fixed") ?? 0,
            },
            {
                id: "subscription",
                name: "Abos",
                amount: map.get("subscription") ?? 0,
            },
            {
                id: "installment",
                name: "Ratenzahlungen",
                amount: map.get("installment") ?? 0,
            },
            {
                id: "normal",
                name: "Variable Ausgaben",
                amount: map.get("normal") ?? 0,
            },
        ];
    }, [expenses]);

    const incomes = useMemo(() => {
        return analyticsTx.filter((tx: any) => tx.kind === "income");
    }, [analyticsTx]);

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
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    }, [expenses, gruppen]);


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
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
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
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
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
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    }, [incomes, incomeCategories]);

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



                <section className="border border-gray-300 bg-white p-4">
                    <div className="mb-3 text-[11px] uppercase tracking-wide text-gray-500">
                        Ansicht
                    </div>



                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setAnalyticsView("booked")}
                            className={`border px-3 py-2 text-sm ${analyticsView === "booked"
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            Gebucht
                        </button>

                        <button
                            type="button"
                            onClick={() => setAnalyticsView("planned")}
                            className={`border px-3 py-2 text-sm ${analyticsView === "planned"
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            Geplant
                        </button>

                        <button
                            type="button"
                            onClick={() => setAnalyticsView("active")}
                            className={`border px-3 py-2 text-sm ${analyticsView === "active"
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            Alle aktiv
                        </button>
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                        {analyticsView === "booked" &&
                            "Analyse der bereits gebuchten Transaktionen."}
                        {analyticsView === "planned" &&
                            "Analyse der geplanten Transaktionen."}
                        {analyticsView === "active" &&
                            "Analyse aller aktiven Transaktionen ohne stornierte."}
                    </p>
                </section>

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

                         // Anzeige des CategoryBarChart mit den gruppierten Ausgaben
                        <CategoryBarChart data={byGroup
                            .filter((row) => row.amount !== 0)
                            .map((row) => ({
                                name: row.name,
                                amount: Math.abs(row.amount),
                            }))} />

                        <DetailsTable title="Ausgaben nach Zahlungsart">
                            <table className="w-full table-fixed border-collapse text-[11px] sm:text-xs">
                                <tbody>
                                    {byPaymentType.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="border-b border-gray-100 px-3 py-1.5 text-gray-700">
                                                {row.name}
                                            </td>
                                            <td className="w-[35%] whitespace-nowrap border-b border-gray-100 px-3 py-1.5 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DetailsTable>

                        <GroupBudgetSettings />

                        <DetailsTable title="Ausgaben nach Gruppen">
                            <table className="w-full table-fixed border-collapse text-[11px] sm:text-xs">
                                <tbody>
                                    {byGroup.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="border-b border-gray-100 px-3 py-1.5 text-gray-700">
                                                {row.name}
                                            </td>
                                            <td className="w-[35%] whitespace-nowrap border-b border-gray-100 px-3 py-1.5 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DetailsTable>

                        <DetailsTable title="Größte Anbieter">
                            <table className="w-full table-fixed border-collapse text-[11px] sm:text-xs">
                                <tbody>
                                    {byAnbieter.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="border-b border-gray-100 px-3 py-1.5 text-gray-700">
                                                {row.name}
                                            </td>
                                            <td className="w-[35%] whitespace-nowrap border-b border-gray-100 px-3 py-1.5 text-right font-semibold tabular-nums text-red-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DetailsTable>
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

                        <DetailsTable title="Einnahmequellen">
                            <table className="w-full table-fixed border-collapse text-[11px] sm:text-xs">
                                <tbody>
                                    {byIncomeSource.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="border-b border-gray-100 px-3 py-1.5 text-gray-700">
                                                {row.name}
                                            </td>
                                            <td className="w-[35%] whitespace-nowrap border-b border-gray-100 px-3 py-1.5 text-right font-semibold tabular-nums text-green-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DetailsTable>

                        <DetailsTable title="Einnahmekategorien">
                            <table className="w-full table-fixed border-collapse text-[11px] sm:text-xs">
                                <tbody>
                                    {byIncomeCategory.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100">
                                            <td className="border-b border-gray-100 px-3 py-1.5 text-gray-700">
                                                {row.name}
                                            </td>
                                            <td className="w-[35%] whitespace-nowrap border-b border-gray-100 px-3 py-1.5 text-right font-semibold tabular-nums text-green-700">
                                                {fmtMoney(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DetailsTable>
                    </section>
                </section>
            </main>
        </div>
    );
}