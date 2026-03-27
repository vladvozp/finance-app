// src/pages/SetupPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccountsStore } from "../store/accounts";
import Button from "../components/Button";

const CURRENCIES = ["EUR", "USD", "CHF", "GBP"];


export default function SetupPage() {
    const navigate = useNavigate();
    const { addAccount } = useAccountsStore();

    const [name, setName] = useState("Hauptkonto");
    const [balance, setBalance] = useState("");
    const [currency, setCurrency] = useState("EUR");
    const [error, setError] = useState("");

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
        <div className="bg-white py-30 mx-auto">
            <div className="flex flex-col px-5 gap-6">
                <div className="mb-10 text-center">
                    <h1 className="text-sm font-bold text-gray-800">  </h1>
                    <p className="text-xl font-bold text-gray-800">
                        Erstelle dein erstes Konto <p> und sieh sofort deinen aktuellen Kontostand.
                        </p></p>
                </div>
                <div className="flex flex-col gap-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kontoname
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="z. B. Hauptkonto oder PayPal"
                            className="w-full h-12 border border-gray-400 px-3 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        />
                    </div>

                    {/* Balance */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dein aktueller Kontostand
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
                    <Button onClick={handleSubmit} variant="primary"> Konto erstellen und starten</Button>
                </div>
            </div>
        </div>
    );
}