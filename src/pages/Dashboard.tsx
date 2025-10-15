import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";

type Tx = {
    id: string;
    kind: "expense" | "income";
    amount: number;            // expected: negative for expense, positive for income
    gruppeId: string;
    kategorieId: string;
    anbieterId?: string | null;
    kontoId?: string | null;
    remark?: string;
    date: string | null;       // ISO string or null
    repeat?: boolean;
};

const KEY = "ft_transactions";

export default function Dashboard() {
    const [items, setItems] = useState<Tx[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [spinOnce, setSpinOnce] = useState(false);

    // spins the gear once (tiny UX detail)
    const onGearClick = () => {
        if (spinOnce) return;
        setSpinOnce(true);
        setTimeout(() => setSpinOnce(false), 600);
    };

    // load transactions from localStorage once on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) {
                setItems([]);
                setParseError(null);
                return;
            }
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                setItems(parsed);
                setParseError(null);
            } else {
                setItems([]);
                setParseError("Ungültiges Format (kein Array).");
            }
        } catch {
            setItems([]);
            setParseError("Fehler beim Lesen oder Parsen.");
        }
    }, []);

    // currency/ date format helpers (DE locale)
    const fmtMoney = (n: number) =>
        new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

    const fmtDate = (iso: string | null) => {
        if (!iso) return "—";
        const d = new Date(iso);
        return isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("de-DE").format(d);
    };

    // derive totals (balance, income total, expense total)
    const { total, incomeTotal, expenseTotal } = useMemo(() => {
        let bal = 0, inc = 0, exp = 0;
        for (const t of items) {
            const a = Number.isFinite(t.amount) ? t.amount : 0;
            bal += a;
            if (t.kind === "income") inc += a;         // should be positive already
            else if (t.kind === "expense") exp += a;   // should be negative already
        }
        return { total: bal, incomeTotal: inc, expenseTotal: exp };
    }, [items]);

    // badge + amount class helpers
    const kindBadge = (kind: Tx["kind"]) =>
        kind === "income"
            ? "px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
            : "px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";

    const amountClass = (kind: Tx["kind"]) =>
        kind === "income" ? "text-green-700 font-semibold" : "text-red-700 font-semibold";

    // --- parse error state ---
    if (parseError) {
        return (
            <section className="max-w-3xl mx-auto p-4 space-y-4">
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
                        <button
                            aria-label="Einstellungen"
                            className="p-2 rounded-md hover:bg-gray-100 transition"
                            onClick={onGearClick}
                            type="button"
                        >
                            <Settings className={`h-6 w-6 ${spinOnce ? "rotate-once" : ""}`} />
                        </button>
                    }
                />
                <div className="alert alert-error">
                    <span>Fehlerhafte Daten: {parseError}</span>
                </div>
                <p className="text-sm opacity-80">
                    Lösche den Schlüssel <code>{KEY}</code> im Local Storage und speichere
                    die Transaktion erneut.
                </p>
            </section>
        );
    }

    // --- main layout ---
    return (
        <div className="bg-white">
            <style>{`
        @keyframes spin-once { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .rotate-once { animation: spin-once 0.6s linear 1; }
      `}</style>

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
                        <button
                            aria-label="Einstellungen"
                            className="p-2 rounded-md hover:bg-gray-100 transition"
                            onClick={onGearClick}
                            type="button"
                        >
                            <Settings className={`h-6 w-6 ${spinOnce ? "rotate-once" : ""}`} />
                        </button>
                    }
                />

                {/* empty state */}
                {items.length === 0 ? (
                    <div className="card bg-base-200 p-6 mt-4">
                        <p className="opacity-80">Keine Daten vorhanden.</p>
                        <div className="mt-3 flex gap-2">
                            <Link to="/" className="btn">Zur Startseite</Link>
                            <Link to="/guestTransactionStep1" className="btn btn-primary">Neue Transaktion</Link>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        {/* summary cards: balance + split */}
                        <div className="stats shadow w-full">
                            <div className="stat">
                                <div className="stat-title">Gesamtbilanz</div>
                                <div className="stat-value">{fmtMoney(total)}</div>
                                <div className="stat-desc">{items.length} Einträge</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Income</div>
                                <div className="stat-value text-green-700">{fmtMoney(incomeTotal)}</div>
                                <div className="stat-desc">Einnahmen</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Expense</div>
                                <div className="stat-value text-red-700">{fmtMoney(expenseTotal)}</div>
                                <div className="stat-desc">Ausgaben</div>
                            </div>
                        </div>

                        {/* transactions table with kind badge + colored amount */}
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Typ</th>
                                        <th>Datum</th>
                                        <th>Kategorie</th>
                                        <th>Gruppe</th>
                                        <th className="text-right">Betrag</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((tx) => (
                                        <tr key={tx.id}>
                                            {/* type badge */}
                                            <td>
                                                <span className={kindBadge(tx.kind)}>
                                                    {tx.kind === "income" ? "Income" : "Expense"}
                                                </span>
                                            </td>

                                            {/* date */}
                                            <td>{fmtDate(tx.date)}</td>

                                            {/* category/ group (fallback to "—") */}
                                            <td>{tx.kategorieId || "—"}</td>
                                            <td>{tx.gruppeId || "—"}</td>

                                            {/* amount with kind color; amount is already signed in storage */}
                                            <td className={`text-right tabular-nums ${amountClass(tx.kind)}`}>
                                                {fmtMoney(Number.isFinite(tx.amount) ? tx.amount : 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
