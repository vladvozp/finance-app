import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";

type Tx = {
    id: string;
    kind: "expense" | "income";
    amount: number;
    gruppeId: string;
    kategorieId: string;
    anbieterId?: string | null;
    kontoId?: string | null;
    remark?: string;
    date: string | null;
    repeat?: boolean;
};

const KEY = "ft_transactions";

export default function Dashboard() {
    const [items, setItems] = useState<Tx[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [spinOnce, setSpinOnce] = useState(false);

    // Handle gear icon rotation
    const onGearClick = () => {
        if (spinOnce) return;
        setSpinOnce(true);
        setTimeout(() => setSpinOnce(false), 600);
    };

    // Load transactions from localStorage on mount
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

    // Calculate total balance
    const total = useMemo(
        () => items.reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0),
        [items]
    );

    // Format helpers
    const fmtMoney = (n: number) =>
        new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

    const fmtDate = (iso: string | null) => {
        if (!iso) return "—";
        const d = new Date(iso);
        return isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("de-DE").format(d);
    };

    // --- State: parsing error ---
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

    // --- Main layout ---
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

                {/* --- State: no data --- */}
                {items.length === 0 ? (
                    <div className="card bg-base-200 p-6 mt-4">
                        <p className="opacity-80">Keine Daten vorhanden.</p>
                        <div className="mt-3 flex gap-2">
                            <Link to="/" className="btn">
                                Zur Startseite
                            </Link>
                            <Link to="/guestTransactionStep1" className="btn btn-primary">
                                Neue Transaktion
                            </Link>
                        </div>
                    </div>
                ) : (
                    // --- State: normal data ---
                    <div className="mt-4 space-y-4">
                        {/* Summary block */}
                        <div className="stats shadow w-full">
                            <div className="stat">
                                <div className="stat-title">Gesamtbilanz</div>
                                <div className="stat-value">{fmtMoney(total)}</div>
                                <div className="stat-desc">{items.length} Einträge</div>
                            </div>
                        </div>

                        {/* Transaction table */}
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Datum</th>
                                        <th>Kategorie</th>
                                        <th>Gruppe</th>
                                        <th className="text-right">Betrag</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((tx) => (
                                        <tr key={tx.id}>
                                            <td>{fmtDate(tx.date)}</td>
                                            <td>{tx.kategorieId || "—"}</td>
                                            <td>{tx.gruppeId || "—"}</td>
                                            <td className="text-right">{fmtMoney(tx.amount || 0)}</td>
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
