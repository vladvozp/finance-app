import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAccountsStore } from "../store/accounts";
import { MoveLeft } from "lucide-react";
import PageHeader from "../components/PageHeader";

const CURRENCIES = ["EUR", "USD", "CHF", "GBP"];

export default function AccountEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { accounts, updateAccount, removeAccount } = useAccountsStore();

    const account = accounts.find(a => a.id === id);

    const [name, setName] = useState(account?.name ?? "");
    const [balance, setBalance] = useState(String(account?.snapshotBalance ?? 0));
    const [currency, setCurrency] = useState(account?.currency ?? "EUR");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!account) navigate("/MonthPage");
    }, [account]);

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Bitte einen Kontonamen eingeben.");
            return;
        }
        const balanceNum = Number(String(balance).replace(",", "."));
        if (!Number.isFinite(balanceNum)) {
            setError("Ungültiger Betrag.");
            return;
        }

        await updateAccount(id!, {
            name: name.trim(),
            snapshotBalance: balanceNum,
            snapshotAt: new Date().toISOString(),
            currency,
        });

        navigate("/MonthPage");
    };

    const handleDelete = async () => {
        if (!window.confirm(`Konto "${name}" wirklich löschen?`)) return;
        await removeAccount(id!);
        navigate("/MonthPage");
    };

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col max-w-sm mx-auto px-4 gap-4">
                <PageHeader
                    left={
                        <Link to="/MonthPage"
                            className="flex items-center gap-1 text-sm text-gray-600 underline hover:text-gray-800">
                            <MoveLeft className="w-5 h-5" /> Zurück
                        </Link>
                    }
                    center={null}
                    right={null}
                />

                <h1 className="text-lg font-bold text-gray-900">Konto bearbeiten</h1>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kontoname</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-12 border border-gray-400 px-3 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aktueller Kontostand</label>
                        <input
                            inputMode="decimal"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            className="w-full h-12 border border-gray-400 px-3 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Währung</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full h-12 border border-gray-400 px-3 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white"
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <button
                        type="button"
                        onClick={handleSave}
                        className="w-full h-12 bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                    >
                        Speichern
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full h-12 border border-red-300 text-red-600 font-medium hover:bg-red-50 transition"
                    >
                        Konto löschen
                    </button>
                </div>
            </main>
        </div>
    );
}