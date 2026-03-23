// src/pages/SetupPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccountsStore } from "../store/accounts";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";

const CURRENCIES = ["EUR", "USD", "CHF", "GBP"];


export default function SetupPage() {
    const navigate = useNavigate();
    const { addAccount } = useAccountsStore();

    const [name, setName] = useState("Hauptkonto");
    const [balance, setBalance] = useState("");
    const [currency, setCurrency] = useState("EUR");
    const [error, setError] = useState("");

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.is_anonymous) {
                setBalance("5000");
            }
        });
    }, []);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError("Bitte einen Kontonamen eingeben.");
            return;
        }

        const balanceNum = Number(String(balance).replace(",", "."));
        if (balance && !Number.isFinite(balanceNum)) {
            setError("Ungültiger Betrag.");
            return;
        }

        const acc = await addAccount(name.trim(), true);

        if (balance) {
            await useAccountsStore.getState().updateAccount(acc.id, {
                snapshotBalance: balanceNum,
                snapshotAt: new Date().toISOString(),
                currency,
            });
        }

        navigate("/MonthPage");
    };

    return (
        <div className="bg-white">
            <div className="py-6 flex flex-col max-w-5xl mx-auto px-4 gap-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Willkommen 👋</h1>
                <p className="text-sm text-gray-500 mb-8">
                    Erstelle dein erstes Konto um zu starten.
                </p>

                <div className="flex flex-col gap-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kontoname
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="z. B. Hauptkonto, Sparkasse"
                            className="w-full h-12 border border-gray-400 px-3 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        />
                    </div>

                    {/* Balance */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aktueller Kontostand
                        </label>
                        <input
                            inputMode="decimal"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            placeholder="0,00"
                            className="w-full h-12 border border-gray-400 px-3 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Optional — du kannst ihn später anpassen.
                        </p>
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Währung
                        </label>
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

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                    <Button onClick={handleSubmit} variant="primary"> Konto erstellen & starten</Button>
                </div>
            </div>
        </div>
    );
}