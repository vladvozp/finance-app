// src/pages/GuestTransactionOne.tsx
import React, {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
    ChangeEvent,
    KeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";
import {
    ChevronsDown,
    MoveLeft,
    Edit3,
    Trash2,
    Plus,
    Settings,
    Search,
    Delete,
    Save,
} from "lucide-react";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";
import type { TxStatus } from "../types/tx";
import { Account } from "../types/account";

import DatePickerInput from "../components/DatePickerInput";

import { Combobox, type ComboOption } from "../components/ui/combobox";
import { useDicts } from "../store/dicts";
import { useIncomeDicts } from "../store/incomeDicts";

import { fmtEur, toCents } from "../utils/currency";
import { getMostUsedGroupForProvider } from "../services/providerStatsService";
import { useAccounts, type AccountWithBalance } from "../hooks/useAccounts";
import { useTransactionForm } from "../hooks/useTransactionForm";
import { useAccountsStore } from "../store/accounts";

type Provider = ComboOption & {};
type Group = ComboOption & {};

const GuestTransactionOne: React.FC = () => {
    const navigate = useNavigate();

    const draft = useTxDraft() as any;
    const {
        amount = 0,
        accountId = "",
        gruppeId = "",
        anbieterId = "",
        remark = "",
    } = draft as {
        amount?: number;
        accountId?: string;
        gruppeId?: string;
        anbieterId?: string;
        remark?: string;
    };

    const [query, setQuery] = useState<string>("");
    const [open, setOpen] = useState<boolean>(false);
    const [showAll, setShowAll] = useState<boolean>(false);
    const comboboxRef = useRef<HTMLDivElement | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempBalance, setTempBalance] = useState<string>("");

    const { addAccount, updateAccount, removeAccount } = useAccountsStore();

    const {
        accounts,
        selectedAccountId,
        setSelectedAccountId,
        selectedAccountName,
        setSelectedAccountName,
        accountsWithBalance,
        totalBalance,
        filtered,
    } = useAccounts(accountId, query, setQuery);

    const {
        date, setDate,
        isPlanned, setIsPlanned,
        saving,
        amountStr,
        providerStats,
        onAmountChange,
        handleKeyDown,
        handleBlur,
        canSave,
        handleSave,
    } = useTransactionForm(
        amount,
        selectedAccountId,
        selectedAccountName,
        anbieterId,
        gruppeId,
    );

    // Close combobox on outside click
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!open) return;
            if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    const onAccountPick = (acc: { id: string; name: string }) => {
        setSelectedAccountId(acc.id);
        setSelectedAccountName(acc.name);
        setQuery(acc.name);
        setOpen(false);
        txDraft.setMany({ accountId: acc.id, kontoName: acc.name });
    };

    const {
        gruppen, createGroup, renameGroup, deleteGroup,
        createProvider, renameProvider, deleteProvider,
    } = useDicts();
    const { incomeTypes, sources } = useIncomeDicts();

    const anbieter = useDicts((s) => s.anbieter);

    const providerOptions: Provider[] = useMemo(() => {
        const list = [...anbieter];
        list.sort((a, b) => {
            const sa = providerStats.providerCounts[a.id] || 0;
            const sb = providerStats.providerCounts[b.id] || 0;
            if (sa !== sb) return sb - sa;
            return a.name.localeCompare(b.name);
        });
        return list;
    }, [anbieter, providerStats]);

    const onProviderChange = useCallback((id: string) => {
        txDraft.set("anbieterId", id);
        if (!id) return;
        const bestGroupId = getMostUsedGroupForProvider(id, providerStats);
        if (bestGroupId) txDraft.set("gruppeId", bestGroupId);
    }, [providerStats]);

    const onGroupChange = useCallback((id: string) => {
        txDraft.set("gruppeId", id);
    }, []);

    const startEdit = (acc: AccountWithBalance) => {
        setEditingId(acc.id);
        const current = acc.snapshotBalance ?? acc.openingBalance ?? 0;
        setTempBalance(String(current));
    };

    const saveEdit = (accId: string) => {
        const valueNum = Number(String(tempBalance).replace(",", "."));
        if (Number.isNaN(valueNum)) {
            setEditingId(null);
            return;
        }
        updateAccount(accId, {
            snapshotBalance: valueNum,
            snapshotAt: new Date().toISOString(),
        });
        setEditingId(null);
    };

    const cancelEdit = () => setEditingId(null);

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link to="/MonthPage"
                            className="flex items-center gap-1 text-sm text-gray-600 underline hover:text-gray-800">
                            <MoveLeft className="w-5 h-5" />Zurück
                        </Link>
                    }
                    center={null}
                    right={
                        <Link to="/SettingsPage" aria-label="Einstellungen"
                            className="group p-2 text-gray-600 transition inline-flex items-center justify-center">
                            <Settings className="w-5 h-5 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />

                <section className="flex-1">
                    <h1 className="text-lg text-gray-600 mb-6">Transaktion anlegen</h1>
                    <div className="mt-6">
                        <h2 className="text-center text-black text-base font-medium mb-1">Betrag</h2>
                        <input
                            inputMode="decimal"
                            placeholder="0,00"
                            value={amountStr}
                            onChange={onAmountChange}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            className="h-12 w-full border shadow-sm border-gray-400 px-3 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                            aria-label="Betrag"
                        />
                        <p className="mt-1 text-xs text-gray-500">Nur positive Beträge. Beispiel: 12,99</p>
                    </div>
                </section>

                <section className="mt-6" ref={comboboxRef}>
                    <h2 className="text-center text-black text-base font-medium mb-1">Konto</h2>

                    <div className="relative">
                        <span className="pointer-events-none text-gray-600 absolute inset-y-0 left-3 flex items-center">
                            <Search className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            placeholder="Sparkasse"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedAccountId("");
                                setSelectedAccountName("");
                                setOpen(true);
                            }}
                            onFocus={() => setOpen(true)}
                            className="h-12 w-full border shadow-sm border-gray-500/80 pl-9 pr-10 outline-none placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                            aria-autocomplete="list"
                            aria-expanded={open}
                            aria-controls="account-listbox"
                            role="combobox"
                        />
                        {query && (
                            <button type="button" aria-label="Eingabe löschen"
                                onClick={() => {
                                    setQuery("");
                                    setSelectedAccountId("");
                                    setSelectedAccountName("");
                                    setOpen(true);
                                }}
                                className="absolute inset-y-0 right-2 flex items-center rounded p-1">
                                <Delete className="h-5 w-5 text-gray-600 hover:text-red-500 cursor-pointer transition-colors duration-200 hover:scale-110" />
                            </button>
                        )}
                    </div>

                    {open && (
                        <div className="relative z-20" role="listbox" id="account-listbox" aria-label="Kontoliste">
                            <ul className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-[#F6F0FF] p-2 shadow">
                                {filtered.map((acc) => (
                                    <li key={acc.id}>
                                        <button type="button" onClick={() => onAccountPick(acc)}
                                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition ${selectedAccountId === acc.id ? "bg-white shadow-sm" : "cursor-pointer hover:bg-white/70"}`}
                                            role="option" aria-selected={selectedAccountId === acc.id}>
                                            <span className="font-medium truncate" title={acc.name}>{acc.name}</span>
                                            <span className="tabular-nums">{fmtEur(acc.balance || 0)}</span>
                                        </button>
                                    </li>
                                ))}
                                <li className="mt-1 border-t border-gray-200 pt-1">
                                    <button type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            const rawName = window.prompt("Enter account name:", "New account");
                                            if (!rawName?.trim()) return;
                                            const acc = addAccount(rawName.trim());
                                            onAccountPick(acc);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left cursor-pointer hover:bg-white/70 transition">
                                        <Plus className="w-5 h-5" />
                                        <span>Neues Konto erstellen</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}

                    <button type="button" onClick={() => setShowAll((v) => !v)}
                        className="mt-3 flex items-center gap-1 text-sm text-gray-600 cursor-pointer underline hover:text-gray-800">
                        <ChevronsDown className="w-5 h-5" />
                        <span>{showAll ? "Alle Konten verbergen" : "Alle Konten anzeigen"}</span>
                    </button>

                    {showAll && (
                        <div className="mt-3 shadow-sm border border-gray-200 p-3">
                            <div className="flex items-center justify-between mb-2">
                                <strong>Kontenübersicht</strong>
                                <span className="text-sm text-gray-600">Gesammelt: {fmtEur(totalBalance)}</span>
                            </div>
                            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto pr-1">
                                {accountsWithBalance.map((acc) => (
                                    <li key={acc.id} className="py-2 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <button type="button"
                                                onClick={() => {
                                                    const nextName = window.prompt("Neuer Kontoname:", acc.name)?.trim();
                                                    if (!nextName || nextName === acc.name) return;
                                                    updateAccount(acc.id, { name: nextName });
                                                }}
                                                className="p-1 cursor-pointer transition hover:scale-105"
                                                title="Konto umbenennen" aria-label="Konto umbenennen">
                                                <Edit3 className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <span className="font-medium truncate" title={acc.name}>{acc.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {editingId === acc.id ? (
                                                <input
                                                    type="number" inputMode="decimal"
                                                    value={tempBalance}
                                                    onChange={(e) => setTempBalance(e.target.value)}
                                                    onBlur={() => saveEdit(acc.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") saveEdit(acc.id);
                                                        if (e.key === "Escape") cancelEdit();
                                                    }}
                                                    className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="tabular-nums cursor-pointer hover:text-blue-600 transition hover:scale-[1.02]"
                                                    onClick={() => startEdit(acc)}>
                                                    {fmtEur(acc.balance ?? 0)}
                                                </span>
                                            )}
                                            <button type="button" title="Konto löschen" aria-label="Konto löschen"
                                                onClick={() => {
                                                    if (!window.confirm(`Konto "${acc.name}" wirklich löschen?`)) return;
                                                    removeAccount(acc.id);
                                                    if (selectedAccountId === acc.id) {
                                                        setSelectedAccountId("");
                                                        setSelectedAccountName("");
                                                        setQuery("");
                                                    }
                                                }}
                                                className="p-1 text-gray-600 hover:text-red-600 transition cursor-pointer hover:scale-110">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex gap-3 mt-6" />
                    <h2 className="text-center text-black text-base font-medium mb-1">Datum</h2>
                    <DatePickerInput
                        value={date}
                        onChange={setDate}
                        label
                        minDate={new Date(2020, 0, 1)}
                        maxDate={new Date(2030, 11, 31)}
                        placeholder="Tag/Monat/Jahr"
                        displayFormat="dd.MM.yyyy"
                    />
                    <div className="mt-3 flex items-center gap-2">
                        <input id="tx-planned" type="checkbox" checked={isPlanned}
                            onChange={(e) => setIsPlanned(e.target.checked)} className="h-4 w-4" />
                        <label htmlFor="tx-planned" className="text-sm text-gray-700">Geplannt</label>
                    </div>

                    <div className="flex gap-3 mt-6" />

                    <Combobox<Provider>
                        label="Anbieter"
                        helperText="Meistgenutzte Anbieter stehen oben, z. B. Rewe, Aldi, Aral …"
                        options={providerOptions}
                        value={anbieterId}
                        onChange={onProviderChange}
                        placeholder="z. B. Rewe, Aral, Amazon"
                        allowCreate
                        onCreate={(name) => {
                            const id = createProvider(name, "");
                            txDraft.set("anbieterId", id);
                        }}
                        allowEdit
                        onEdit={(id, newName) => renameProvider(id, newName)}
                        onDelete={(id) => {
                            deleteProvider(id);
                            if (anbieterId === id) txDraft.set("anbieterId", "");
                        }}
                    />

                    <div className="mb-2 flex items-center justify-between mt-4">
                        <div className="text-base font-medium">Gruppe</div>
                        <span className="text-xs text-gray-500">optional, z. B. Essen, Mobilität …</span>
                    </div>

                    <Combobox<Group>
                        label=""
                        options={gruppen}
                        value={gruppeId}
                        onChange={onGroupChange}
                        placeholder="Gruppe wählen… (z. B. Essen, Mobilität)"
                        allowCreate
                        onCreate={(name) => {
                            const id = createGroup(name);
                            txDraft.set("gruppeId", id);
                        }}
                        allowEdit
                        onEdit={(id, newName) => renameGroup(id, newName)}
                        onDelete={(id) => {
                            deleteGroup(id);
                            if (gruppeId === id) txDraft.set("gruppeId", "");
                        }}
                    />

                    <div className="mt-6">
                        <div className="flex justify-center items-center text-black text-base gap-2 font-medium mb-1">
                            <span>Bemerkung</span>
                            <Edit3 className="w-4 h-4" />
                        </div>
                        <div className="relative">
                            <textarea
                                value={remark}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v.length <= 100) txDraft.set("remark", v);
                                }}
                                placeholder="Optionale Notiz (z. B. 'Aktion', 'für Schule' …)"
                                className="w-full h-24 border pl-3 pr-3 py-2 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none outline-none placeholder-gray-400"
                                maxLength={100}
                            />
                            <span className="absolute bottom-1 right-3 text-xs text-gray-500">
                                {remark.length}/100
                            </span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button variant="primary" icon={Save} disabled={!canSave || saving} onClick={handleSave}>
                            {saving ? "Speichern…" : "Speichern"}
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default GuestTransactionOne;