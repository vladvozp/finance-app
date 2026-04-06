// src/pages/GuestTransactionOne.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";
import {
    ChevronsDown,
    MoveLeft,
    Settings,
    Save,
} from "lucide-react";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";
import { Combobox, type ComboOption } from "../components/ui/combobox";
import { useDicts } from "../store/dicts";
import { useAccounts } from "../hooks/useAccounts";
import { useTransactionForm } from "../hooks/useTransactionForm";

function fmtMoney(n: number) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(n);
}

type Provider = ComboOption & {};
type Group = ComboOption & {};

const GuestTransactionOne: React.FC = () => {
    const draft = useTxDraft() as any;

    const {
        amount = 0,
        accountId = "",
        gruppeId = "",
        anbieterId = "",
    } = draft;

    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);

    const {
        gruppen = [],
        createGroup,
        renameGroup,
        deleteGroup,
        createProvider,
        renameProvider,
        deleteProvider,
    } = useDicts();

    const anbieter = useDicts((s) => s.anbieter ?? []);

    const {
        accounts,
        selectedAccountId,
        setSelectedAccountId,
        selectedAccountName,
        setSelectedAccountName,
        totalBalance,
        filtered,
    } = useAccounts(accountId, query, setQuery);

    const {
        date,
        setDate,
        isPlanned,
        setIsPlanned,
        saving,
        amountStr,
        onAmountChange,
        handleBlur,
        handleSave,
    } = useTransactionForm(
        amount,
        selectedAccountId,
        selectedAccountName,
        anbieterId,
        gruppeId
    );

    const providerOptions: Provider[] = useMemo(() => {
        return [...anbieter];
    }, [anbieter]);

    const onProviderChange = (id: string) => {
        txDraft.set("anbieterId", id);
    };

    const onGroupChange = (id: string) => {
        txDraft.set("gruppeId", id);
    };

    const onAccountPick = (acc: any) => {
        setSelectedAccountId(acc.id);
        setSelectedAccountName(acc.name);
        setQuery(acc.name);
        setOpen(false);
        txDraft.setMany({ accountId: acc.id, kontoName: acc.name });
    };

    const [showGroup, setShowGroup] = useState(false);

    function toDateInputValue(date: Date | null): string {
        if (!date) return "";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }



    return (
        <div className="bg-white min-h-screen">
            <main className="py-6 px-4 max-w-md mx-auto">

                {/* HEADER */}
                <PageHeader
                    left={
                        <Link to="/MonthPage" className="flex items-center gap-1 text-sm text-gray-600">
                            <MoveLeft className="w-5 h-5" />Zurück
                        </Link>
                    }
                    center={
                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase">Gesamtstand</div>
                            <div className="font-semibold">{fmtMoney(totalBalance)}</div>
                        </div>
                    }
                    right={
                        <Link to="/SettingsPage">
                            <Settings className="w-5 h-5" />
                        </Link>
                    }
                />

                {/* AMOUNT */}
                <section className="pt-8">
                    <input
                        autoFocus
                        inputMode="decimal"
                        placeholder="0,00 €"
                        value={amountStr}
                        onChange={onAmountChange}
                        onBlur={handleBlur}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && amountStr) handleSave();
                        }}
                        className="w-full text-5xl text-center outline-none placeholder-gray-300"
                    />
                </section>

                {/* PROVIDER */}
                <section className="mt-8">
                    <Combobox<Provider>
                        label=""
                        options={providerOptions ?? []}
                        value={anbieterId}
                        onChange={onProviderChange}
                        placeholder="Lidl, Kaffee, Tanken …"
                        allowCreate
                        onCreate={(name) => {
                            const id = createProvider(name, "");
                            txDraft.set("anbieterId", id);
                        }}
                        allowEdit
                        onEdit={(id, newName) => renameProvider(id, newName)}
                        onDelete={(id) => deleteProvider(id)}
                    />
                </section>

                {/* ACCOUNT + DATE + PLANNED */}
                <section className="mt-6">
                    <div className="flex gap-2">

                        {/* ACCOUNT */}
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="flex flex-1 h-12 items-center justify-between border px-3"
                        >
                            {selectedAccountName || "Konto wählen"}
                            <ChevronsDown className="w-4 h-4" />
                        </button>

                        {/* DATE */}
                        <button
                            type="button"
                            onClick={() => document.getElementById("date")?.click()}
                            className="h-12 w-[120px] border px-3"
                        >
                            {date ? new Date(date).toLocaleDateString("de-DE") : "Heute"}
                        </button>

                        {/* PLANNED */}
                        <button
                            type="button"
                            onClick={() => setIsPlanned(!isPlanned)}
                            className={`h-12 px-3 border ${isPlanned ? "bg-blue-100" : ""
                                }`}
                        >
                            Geplant
                        </button>
                    </div>

                    <input
                        id="date"
                        type="date"
                        value={toDateInputValue(date)}
                        onChange={(e) => {
                            const value = e.target.value;
                            setDate(value ? new Date(value) : null);
                        }}
                        className="hidden"
                    />
                </section>

                {/* ACCOUNT LIST */}
                {open && (
                    <div className="mt-2 border p-2">
                        {filtered.map((acc: any) => (
                            <div key={acc.id}>
                                <button onClick={() => onAccountPick(acc)}>
                                    {acc.name}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* GROUP */}
                <section className="mt-6">
                    {!showGroup ? (
                        <button onClick={() => setShowGroup(true)}>
                            + Gruppe hinzufügen
                        </button>
                    ) : (
                        <Combobox<Group>
                            label=""
                            options={gruppen ?? []}
                            value={gruppeId}
                            onChange={onGroupChange}
                            placeholder="Gruppe wählen"
                            allowCreate
                            onCreate={(name) => {
                                const id = createGroup(name);
                                txDraft.set("gruppeId", id);
                            }}
                            allowEdit
                            onEdit={(id, newName) => renameGroup(id, newName)}
                            onDelete={(id) => deleteGroup(id)}
                        />
                    )}
                </section>

                {/* SAVE */}
                <section className="mt-8">
                    <Button
                        variant="primary"
                        icon={Save}
                        disabled={!amountStr || saving}
                        onClick={handleSave}
                    >
                        {saving ? "Speichern…" : "Speichern"}
                    </Button>
                </section>

            </main>
        </div>
    );
};

export default GuestTransactionOne;