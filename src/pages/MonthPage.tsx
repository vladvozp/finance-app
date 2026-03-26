import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Settings } from "lucide-react";

import PageHeader from "../components/PageHeader";
import Button from "../components/Button";

import { useAccountsStore } from "../store/accounts";
import { useDicts } from "../store/dicts";
import { useIncomeDicts } from "../store/incomeDicts";

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

type MetricCardProps = {
    title: string;
    value: string;
    hint?: string;
    tone?: "neutral" | "red" | "yellow" | "green";
    featured?: boolean;
};

function MetricCard({
    title,
    value,
    hint,
    tone = "neutral",
    featured = false,
}: MetricCardProps) {
    const toneMap = {
        neutral: {
            wrap: "border-gray-300 bg-white",
            title: "text-gray-700",
            value: "text-gray-900",
            hint: "text-gray-500",
        },
        red: {
            wrap: "border-gray-300 bg-white",
            title: "text-gray-700",
            value: "text-red-700",
            hint: "text-gray-500",
        },
        yellow: {
            wrap: "border-gray-300 bg-white",
            title: "text-gray-700",
            value: "text-yellow-700",
            hint: "text-gray-500",
        },
        green: {
            wrap: "border-gray-300 bg-white",
            title: "text-gray-700",
            value: "text-green-700",
            hint: "text-gray-500",
        },
    };

    const c = toneMap[tone];

    return (
        <section className={`min-w-0 border px-4 py-4 ${c.wrap}`}>
            <div className={`text-[11px] font-medium uppercase tracking-wide ${c.title}`}>
                {title}
            </div>

            <div
                className={[
                    "mt-2 min-w-0 truncate font-semibold tabular-nums tracking-tight",
                    featured
                        ? `text-4xl sm:text-5xl ${c.value}`
                        : `text-2xl ${c.value}`,
                ].join(" ")}
                title={value}
            >
                {value}
            </div>

            {hint ? (
                <p className={`mt-2 text-sm leading-6 ${c.hint}`}>
                    {hint}
                </p>
            ) : null}
        </section>
    );
}

export default function MonthPage() {
    const navigate = useNavigate();
    const todayISO = new Date().toISOString().slice(0, 10);

    const {
        transactions,
        getTotalBalance,
        updateTransaction,
        removeTransaction,
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

    const [onlyPlanned, setOnlyPlanned] = useState(false);

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

    const monthTx = useMemo(
        () =>
            transactions.filter((tx) =>
                (tx.date ?? "").startsWith(selectedMonthPrefix)
            ),
        [transactions, selectedMonthPrefix]
    );

    const monthBookedTx = useMemo(
        () =>
            monthTx.filter(
                (tx) => tx.status !== "planned" && tx.status !== "cancelled"
            ),
        [monthTx]
    );

    const monthPlannedTx = useMemo(
        () => monthTx.filter((tx) => tx.status === "planned"),
        [monthTx]
    );

    const tableTx = useMemo(
        () => (onlyPlanned ? monthPlannedTx : monthTx),
        [onlyPlanned, monthPlannedTx, monthTx]
    );

    const expenseTotal = useMemo(
        () =>
            monthBookedTx.reduce((sum, tx) => {
                if (tx.kind !== "expense") return sum;
                return sum + Math.abs(Number.isFinite(tx.amount) ? tx.amount : 0);
            }, 0),
        [monthBookedTx]
    );

    const plannedExpenseTotal = useMemo(
        () =>
            monthPlannedTx.reduce((sum, tx) => {
                if (tx.kind !== "expense") return sum;
                return sum + Math.abs(Number.isFinite(tx.amount) ? tx.amount : 0);
            }, 0),
        [monthPlannedTx]
    );

    const plannedIncomeTotal = useMemo(
        () =>
            monthPlannedTx.reduce((sum, tx) => {
                if (tx.kind !== "income") return sum;
                return sum + (Number.isFinite(tx.amount) ? tx.amount : 0);
            }, 0),
        [monthPlannedTx]
    );

    const available = totalBalance - plannedExpenseTotal + plannedIncomeTotal;

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

                <section className="flex flex-col gap-3">
                    <MetricCard
                        title="Was dir bleibt"
                        value={fmtMoney(available)}
                        hint="Mit geplanten Einnahmen und Ausgaben"
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

                <section className="flex flex-1 flex-col gap-3">
                    {monthTx.length === 0 ? (
                        <div className="border border-gray-300 bg-white px-4 py-6">
                            <h2 className="text-base font-semibold text-gray-900">
                                Noch keine Transaktionen in diesem Monat
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Starte mit deiner ersten Ausgabe oder Einnahme.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    variant="primary"
                                    icon={Plus}
                                    onClick={() => navigate("/GuestTransactionOne")}
                                >
                                    Ausgabe
                                </Button>

                                <Button
                                    variant="primary"
                                    icon={Plus}
                                    onClick={() => navigate("/IncomeTransactionOne")}
                                >
                                    Einnahme
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2">
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

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => navigate("/GuestTransactionOne")}
                                    >
                                        Ausgabe
                                    </Button>

                                    <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => navigate("/IncomeTransactionOne")}
                                    >
                                        Einnahme
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto border border-gray-300 bg-white">
                                <table className="w-full table-fixed border-collapse text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="w-[92px] border-b border-gray-300 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Datum
                                            </th>
                                            <th className="w-[120px] border-b border-gray-300 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Konto
                                            </th>
                                            <th className="w-[150px] border-b border-gray-300 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Anbieter / Quelle
                                            </th>
                                            <th className="w-[150px] border-b border-gray-300 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Gruppe / Kategorie
                                            </th>
                                            <th className="w-[120px] border-b border-gray-300 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Betrag
                                            </th>
                                            <th className="w-[220px] border-b border-gray-300 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                                Aktion
                                            </th>
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

                                            return (
                                                <tr key={tx.id} className={rowClass}>
                                                    <td className="border-b border-gray-200 px-3 py-3 align-middle">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <span className="truncate">{fmtDate(tx.date)}</span>

                                                            {isCancelled ? (
                                                                <span className="shrink-0 border border-gray-300 px-2 py-[1px] text-[10px] text-gray-600">
                                                                    storniert
                                                                </span>
                                                            ) : isPlanned ? (
                                                                <span
                                                                    className={`shrink-0 border px-2 py-[1px] text-[10px] ${isOverdue
                                                                        ? "border-red-300 text-red-700"
                                                                        : isDueToday
                                                                            ? "border-yellow-400 text-yellow-700"
                                                                            : "border-gray-300 text-gray-600"
                                                                        }`}
                                                                >
                                                                    geplant
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>

                                                    <td className="min-w-0 border-b border-gray-200 px-3 py-3 align-middle">
                                                        <span
                                                            className="block truncate"
                                                            title={getKontoName((tx as any).kontoId)}
                                                        >
                                                            {getKontoName((tx as any).kontoId)}
                                                        </span>
                                                    </td>

                                                    <td className="min-w-0 border-b border-gray-200 px-3 py-3 align-middle">
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
                                                    </td>

                                                    <td className="min-w-0 border-b border-gray-200 px-3 py-3 align-middle">
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
                                                    </td>

                                                    <td
                                                        className={`border-b border-gray-200 px-3 py-3 text-right tabular-nums align-middle ${amountClass}`}
                                                        title={fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}
                                                    >
                                                        {fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}
                                                    </td>

                                                    <td className="border-b border-gray-200 px-3 py-3 align-middle">
                                                        {isPlanned ? (
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => markBooked(tx.id)}
                                                                    className="border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                                >
                                                                    durchführen
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => markCancelled(tx.id)}
                                                                    className="border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                                >
                                                                    stornieren
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
                                                                    className="border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                                >
                                                                    bearbeiten
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (window.confirm("Transaktion wirklich löschen?")) {
                                                                            removeTransaction(tx.id);
                                                                        }
                                                                    }}
                                                                    className="border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                                                >
                                                                    löschen
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}