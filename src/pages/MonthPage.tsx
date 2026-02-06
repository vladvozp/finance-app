// src/pages/MonthPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import Arrowleft from "../assets/Arrowleft.svg?react";

import Button from "../components/Button";
import { Plus, Settings, Search, Delete, ChevronsDown, Edit3, Trash2 } from "lucide-react";

import type { Tx } from "../types/tx";
import { readTxList, updateTxStatus } from "../utils/storage";
import { computeAccountBalance } from "../utils/accountBalance";
import { readKontoMap } from "../utils/lookups";
import { useDicts } from "../store/dicts";

import type { Account } from "../types/account";

const ACC_KEY = "ft_accounts";
const TX_KEY = "ft_transactions";

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
        const dt = new Date(y, m - 1, d);
        return new Intl.DateTimeFormat("de-DE").format(dt);
    }
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("de-DE").format(d);
}

function lookupNameById(id?: string | null, collection?: any): string | null {
    if (!id || !collection) return null;
    if (Array.isArray(collection)) {
        const item = collection.find((x) => x?.id === id || x?.value === id || x?.key === id);
        return item?.name ?? item?.label ?? item?.title ?? null;
    }
    if (typeof collection === "object") {
        const item = collection[id];
        if (!item) return null;
        if (typeof item === "string") return item;
        return item?.name ?? item?.label ?? item?.title ?? null;
    }
    return null;
}

/** ===== Month helpers ===== */
function addMonths(base: Date, delta: number) {
    return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}
function monthPrefix(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}
function monthLabelDE(d: Date) {
    return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(d);
}

/** ===== Accounts helpers (1:1 from GuestTransactionOne) ===== */
type AccountWithBalance = Account & { balance: number };

function createDefaultAccount(name: string, isMain = false): Account {
    const now = new Date().toISOString();
    const id = crypto?.randomUUID ? crypto.randomUUID() : `acc_${Date.now()}`;
    return {
        id,
        name,
        currency: "EUR",
        openingBalance: 0,
        openingDate: null,

        snapshotBalance: 0,
        snapshotAt: now,

        archived: false,
        createdAt: now,
        updatedAt: now,
        isMain,
    };
}

export function ensureAccounts(): Account[] {
    try {
        const raw = localStorage.getItem(ACC_KEY);
        if (!raw) {
            const seed = [createDefaultAccount("Hauptkonto", true)];
            localStorage.setItem(ACC_KEY, JSON.stringify(seed));
            return seed;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            const seed = [createDefaultAccount("Hauptkonto", true)];
            localStorage.setItem(ACC_KEY, JSON.stringify(seed));
            return seed;
        }

        let list = parsed as Account[];

        const hasMain = list.some((a) => a.isMain === true);

        if (!hasMain) {
            list = list.map((a, idx) => ({
                ...a,
                isMain: idx === 0,
            }));
        }

        const mainIndices = list
            .map((a, i) => (a.isMain ? i : -1))
            .filter((i) => i >= 0);

        if (mainIndices.length > 1) {
            const keep = mainIndices[0];
            list = list.map((a, idx) => ({
                ...a,
                isMain: idx === keep,
            }));
        }

        localStorage.setItem(ACC_KEY, JSON.stringify(list));
        return list;
    } catch {
        const seed = [createDefaultAccount("Hauptkonto", true)];
        localStorage.setItem(ACC_KEY, JSON.stringify(seed));
        return seed;
    }
}

// Quick create (replace with modal later)
function createNewAccountInteractive(onPicked?: (acc: Account) => void): Account[] | null {
    const rawName = window.prompt("Enter account name:", "New account");
    if (!rawName) return null;

    const name = rawName.trim();
    if (!name) return null;

    let list: Account[] = [];
    try {
        const raw = localStorage.getItem(ACC_KEY);
        list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];
    } catch {
        list = [];
    }

    const exists = list.some((a) => a.name.trim().toLowerCase() === name.toLowerCase());

    if (exists) {
        const proceed = window.confirm(
            `An account named "${name}" already exists.\nCreate another one anyway?`
        );
        if (!proceed) return null;
    }

    const newAcc = createDefaultAccount(name);
    const next = [...list, newAcc];
    localStorage.setItem(ACC_KEY, JSON.stringify(next));

    if (typeof onPicked === "function") onPicked(newAcc);
    return next;
}

// Rename account inline
function renameAccountInteractive(
    accId: string,
    currentName: string,
    onDone?: (updated: Account, all: Account[]) => void
): Account[] | null {
    const nextName = (window.prompt("Neuer Kontoname:", currentName) || "").trim();
    if (!nextName || nextName === currentName) return null;

    let list: Account[] = [];
    try {
        const raw = localStorage.getItem(ACC_KEY) || "[]";
        list = JSON.parse(raw);
        if (!Array.isArray(list)) list = [];
    } catch {
        list = [];
    }

    const idx = list.findIndex((a) => a.id === accId);
    if (idx === -1) return null;

    list[idx] = {
        ...list[idx],
        name: nextName,
        updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(ACC_KEY, JSON.stringify(list));
    if (typeof onDone === "function") onDone(list[idx], list);
    return list;
}

// Edit current balance
function editSnapshotBalanceInteractive(
    accId: string,
    currentSnapshot: number | undefined,
    onDone?: (updated: Account, all: Account[]) => void
): Account[] | null {
    const input = window.prompt("Kontostand JETZT (EUR):", String(currentSnapshot ?? 0));
    if (input == null) return null;

    const n = Number(String(input).replace(",", "."));
    if (!Number.isFinite(n)) {
        alert("Ungültiger Betrag");
        return null;
    }

    let list: Account[] = [];
    try {
        const raw = localStorage.getItem(ACC_KEY) || "[]";
        list = JSON.parse(raw);
        if (!Array.isArray(list)) list = [];
    } catch {
        list = [];
    }

    const idx = list.findIndex((a) => a.id === accId);
    if (idx === -1) return null;

    const now = new Date().toISOString();

    list[idx] = {
        ...list[idx],
        snapshotBalance: n,
        snapshotAt: now,
        updatedAt: now,
    };

    localStorage.setItem(ACC_KEY, JSON.stringify(list));
    if (typeof onDone === "function") onDone(list[idx], list);
    return list;
}

// Persisted delete helper
function deleteAccountInteractive(accId: string, onDone?: (next: Account[]) => void): Account[] | null {
    const accRaw = localStorage.getItem(ACC_KEY);
    const accounts: Account[] = accRaw ? JSON.parse(accRaw) : [];

    const txRaw = localStorage.getItem(TX_KEY);
    const tx: Tx[] = txRaw ? JSON.parse(txRaw) : [];

    const acc = accounts.find((a) => a.id === accId);
    if (!acc) return null;

    const txCount = tx.filter((t) => t && (t as any).kontoId === accId).length;
    if (txCount > 0) {
        alert(`Konto "${acc.name}" hat ${txCount} Buchung(en). Es kann nicht gelöscht werden.`);
        return null;
    }

    const balance = computeAccountBalance(acc, tx);

    if (balance !== 0) {
        alert(`Konto "${acc.name}" kann nur gelöscht werden, wenn der Kontostand 0,00 € ist.`);
        return null;
    }

    if (!window.confirm(`Konto "${acc.name}" wirklich löschen?`)) return null;

    const next = accounts.filter((a) => a.id !== accId);
    localStorage.setItem(ACC_KEY, JSON.stringify(next));

    if (typeof onDone === "function") onDone(next);
    return next;
}

export default function MonthPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState<Tx[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    const [onlyPlanned, setOnlyPlanned] = useState(false);

    const todayISO = new Date().toISOString().slice(0, 10);

    /** ===== Selected month state ===== */
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const selectedMonthPrefix = useMemo(() => monthPrefix(selectedMonth), [selectedMonth]);
    const selectedMonthLabel = useMemo(() => monthLabelDE(selectedMonth), [selectedMonth]);

    const goPrevMonth = () => setSelectedMonth((m) => addMonths(m, -1));
    const goNextMonth = () => setSelectedMonth((m) => addMonths(m, +1));
    const goThisMonth = () => {
        const d = new Date();
        setSelectedMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    };

    const markBooked = (id: string) => {
        const next = updateTxStatus(id, "booked");
        setItems(next);
    };

    const markCancelled = (id: string) => {
        const next = updateTxStatus(id, "cancelled");
        setItems(next);
    };

    /** DICTS */
    const { kategorien, anbieter } = useDicts?.() || {};

    const getKontoName = (() => {
        const kontoMap = readKontoMap();
        return (id?: string) => (id ? kontoMap.get(id) ?? id : "—");
    })();

    const getKategorieName = (gid?: string | null, kid?: string | null) => {
        if (!kid) return "—";
        const col = (kategorien && (kategorien[gid ?? ""] || kategorien[gid as any])) || null;
        return lookupNameById(kid, col) ?? lookupNameById(kid, kategorien) ?? kid;
    };

    const getAnbieterName = (aid?: string | null) => lookupNameById(aid ?? undefined, anbieter) ?? (aid ?? "—");

    /** Load transactions once */
    useEffect(() => {
        try {
            const parsed = readTxList();
            setItems(parsed);
            setParseError(null);
        } catch {
            setItems([]);
            setParseError("Fehler beim Lesen oder Parsen.");
        }
    }, []);

    /** ===== Accounts state (COPY 1:1 flow from GuestTransactionOne) ===== */
    const [query, setQuery] = useState<string>("");
    const [open, setOpen] = useState<boolean>(false);
    const [showAll, setShowAll] = useState<boolean>(false);
    const comboboxRef = useRef<HTMLDivElement | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempBalance, setTempBalance] = useState<string>("");

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [account, setAccount] = useState<Account | null>(null);

    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [selectedAccountName, setSelectedAccountName] = useState<string>("");

    // Ensure accounts exist
    useEffect(() => {
        const accs = ensureAccounts();
        setAccounts(accs);
    }, []);

    // Auto-select main account
    useEffect(() => {
        if (!account && accounts.length > 0) {
            const main = accounts.find((a) => a.isMain) ?? accounts[0];
            setAccount(main);
        }
    }, [accounts, account]);

    // Reflect selected account into query field
    useEffect(() => {
        if (account) {
            setQuery(account.name);
            setSelectedAccountId(account.id);
            setSelectedAccountName(account.name);
        }
    }, [account]);

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

    // Compute balances per account from transactions (uses ALL items like GuestTransactionOne uses TX_KEY)
    const accountsWithBalance: AccountWithBalance[] = useMemo(() => {
        let tx: Tx[] = [];
        try {
            // IMPORTANT: same as GuestTransactionOne (TX_KEY)
            const raw = localStorage.getItem(TX_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            tx = Array.isArray(parsed) ? parsed : [];
        } catch {
            tx = [];
        }

        return accounts.map((acc) => ({
            ...acc,
            balance: computeAccountBalance(acc, tx),
        }));
    }, [accounts]);

    const totalBalance = useMemo(
        () => accountsWithBalance.reduce((s, a) => s + (a.balance || 0), 0),
        [accountsWithBalance]
    );

    const filtered: AccountWithBalance[] = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return accountsWithBalance;
        return accountsWithBalance.filter((a) => a.name.toLowerCase().includes(q));
    }, [query, accountsWithBalance]);

    // Account pick (1:1)
    const onAccountPick = (acc: { id: string; name: string }) => {
        setSelectedAccountId(acc.id);
        setSelectedAccountName(acc.name);
        setQuery(acc.name);
        setOpen(false);
    };

    const startEdit = (acc: AccountWithBalance) => {
        setEditingId(acc.id);
        const current = (acc as any).snapshotBalance ?? (acc as any).openingBalance ?? 0;
        setTempBalance(String(current));
    };

    const saveEdit = (accId: string) => {
        const valueNum = Number(String(tempBalance).replace(",", "."));
        if (Number.isNaN(valueNum)) {
            setEditingId(null);
            return;
        }
        editSnapshotBalanceInteractive(accId, valueNum, (_, l) => setAccounts(l));
        setEditingId(null);
    };

    const cancelEdit = () => setEditingId(null);

    /** ===== Month tx filtering (NO account filter here, to keep MonthPage behavior unchanged) ===== */
    const monthTx = useMemo(
        () => items.filter((tx) => (tx.date ?? "").startsWith(selectedMonthPrefix)),
        [items, selectedMonthPrefix]
    );

    const monthBookedTx = useMemo(
        () => monthTx.filter((tx) => tx.status !== "planned" && tx.status !== "cancelled"),
        [monthTx]
    );

    const expenseTotal = useMemo(
        () =>
            monthBookedTx.reduce((sum, tx) => {
                if (tx.kind !== "expense") return sum;
                const a = Number.isFinite(tx.amount) ? tx.amount : 0;
                return sum + Math.abs(a);
            }, 0),
        [monthBookedTx]
    );

    const monthPlannedTx = useMemo(() => monthTx.filter((tx) => tx.status === "planned"), [monthTx]);

    const tableTx = useMemo(
        () => (onlyPlanned ? monthTx.filter((t) => t.status === "planned") : monthTx),
        [onlyPlanned, monthTx]
    );

    const futureTotal = useMemo(
        () =>
            monthPlannedTx.reduce((sum, tx) => {
                if (tx.kind !== "expense") return sum;
                const a = Number.isFinite(tx.amount) ? tx.amount : 0;
                return sum + Math.abs(a);
            }, 0),
        [monthPlannedTx]
    );

    const available = totalBalance - futureTotal;

    /** Error view */
    if (parseError) {
        return (
            <section className="max-w-3xl mx-auto p-4 space-y-4">
                <PageHeader
                    left={
                        <Link to="/guest" className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800">
                            <Arrowleft className="w-5 h-5" /> Zurück
                        </Link>
                    }
                    center={null}
                    right={null}
                />
                <div className="alert alert-error">
                    <span>Fehlerhafte Daten: {parseError}</span>
                </div>
            </section>
        );
    }

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col max-w-5xl mx-auto px-4 gap-4">
                <p className="text-xs text-red-500">DEBUG MonthPage ACTIVE</p>

                <PageHeader
                    left={
                        <Link to="/login" className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800">
                            <Arrowleft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={goPrevMonth}
                                className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                aria-label="Vorheriger Monat"
                            >
                                ‹
                            </button>

                            <div className="flex flex-col items-center leading-tight">
                                <h1 className="text-sm font-semibold text-gray-600">{selectedMonthLabel}</h1>
                                <button
                                    type="button"
                                    onClick={goThisMonth}
                                    className="text-xs text-gray-500 underline hover:text-gray-700"
                                >
                                    Dieser Monat
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={goNextMonth}
                                className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                                aria-label="Nächster Monat"
                            >
                                ›
                            </button>
                        </div>
                    }
                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group p-2 text-gray-600 transition inline-flex items-center justify-center"
                            type="button"
                        >
                            <Settings className="w-5 h-5 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />

                {/* ====== HAUPTKONTO BALANCE ====== */}
                <section className="border rounded-xl p-3 bg-white">
                    <div className="text-xs text-gray-500">Aktueller Kontostand (gesamt, Bank-Abgleich)</div>
                    <div className="text-xl font-bold text-gray-900">{fmtMoney(totalBalance)}</div>
                </section>

                {/* ====== ACCOUNT SELECTION ====== */}
                <section className="mt-0" ref={comboboxRef}>
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
                            className="h-12 w-full border shadow-sm border-gray-500/80 pl-9 pr-10
                         outline-none placeholder-gray-400
                         focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                            aria-autocomplete="list"
                            aria-expanded={open}
                            aria-controls="account-listbox"
                            role="combobox"
                        />

                        {query && (
                            <button
                                type="button"
                                aria-label="Eingabe löschen"
                                onClick={() => {
                                    setQuery("");
                                    setSelectedAccountId("");
                                    setSelectedAccountName("");
                                    setOpen(true);
                                }}
                                className="absolute inset-y-0 right-2 flex items-center rounded p-1 "
                            >
                                <Delete className="h-5 w-5 text-gray-600 hover:text-red-500 cursor-pointer transition-colors duration-200 hover:scale-110" />
                            </button>
                        )}
                    </div>

                    {open && (
                        <div className="relative z-20" role="listbox" id="account-listbox" aria-label="Kontoliste">
                            <ul className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-[#F6F0FF] p-2 shadow">
                                {filtered.map((acc) => (
                                    <li key={acc.id}>
                                        <button
                                            type="button"
                                            onClick={() => onAccountPick(acc)}
                                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition
                        ${selectedAccountId === acc.id
                                                    ? "bg-white shadow-sm"
                                                    : "cursor-pointer hover:bg-white/70"
                                                }`}
                                            role="option"
                                            aria-selected={selectedAccountId === acc.id}
                                        >
                                            <span className="font-medium truncate" title={acc.name}>
                                                {acc.name}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <span className="tabular-nums">{fmtMoney(acc.balance || 0)}</span>
                                            </div>
                                        </button>
                                    </li>
                                ))}

                                <li className="mt-1 border-t border-gray-200 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            const next = createNewAccountInteractive(onAccountPick);
                                            if (next) setAccounts(next);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left cursor-pointer hover:bg-white/70 transition"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span>Neues Konto erstellen</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowAll((v) => !v)}
                        className="mt-3 flex items-center gap-1 text-sm text-gray-600 cursor-pointer underline hover:text-gray-800"
                    >
                        <ChevronsDown className="w-5 h-5" />
                        <span>{showAll ? "Alle Konten verbergen" : "Alle Konten anzeigen"}</span>
                    </button>

                    {showAll && (
                        <div className="mt-3 shadow-sm border border-gray-200 p-3">
                            <div className="flex items-center justify-between mb-2">
                                <strong>Kontenübersicht</strong>
                                <span className="text-sm text-gray-600">Gesammelt: {fmtMoney(totalBalance)}</span>
                            </div>

                            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto pr-1">
                                {accountsWithBalance.map((acc) => (
                                    <li key={acc.id} className="py-2 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    renameAccountInteractive(acc.id, acc.name, (_, l) => setAccounts(l));
                                                }}
                                                className="p-1 cursor-pointer transition hover:scale-105"
                                                title="Konto umbenennen"
                                                aria-label="Konto umbenennen"
                                            >
                                                <Edit3 className="w-4 h-4 text-gray-600" />
                                            </button>

                                            <span className="font-medium truncate" title={acc.name}>
                                                {acc.name}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {editingId === acc.id ? (
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    value={tempBalance}
                                                    onChange={(e) => setTempBalance(e.target.value)}
                                                    onBlur={() => saveEdit(acc.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") saveEdit(acc.id);
                                                        if (e.key === "Escape") cancelEdit();
                                                    }}
                                                    className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                    title="Anfangssaldo bearbeiten"
                                                    aria-label="Anfangssaldo bearbeiten"
                                                />
                                            ) : (
                                                <span
                                                    className="tabular-nums cursor-pointer hover:text-blue-600 transition hover:scale-[1.02]"
                                                    title="Anfangssaldo bearbeiten"
                                                    onClick={() => startEdit(acc)}
                                                >
                                                    {fmtMoney(acc.balance ?? 0)}
                                                </span>
                                            )}

                                            <button
                                                type="button"
                                                title="Konto löschen"
                                                aria-label="Konto löschen"
                                                onClick={() => {
                                                    const next = deleteAccountInteractive(acc.id, (updated) => setAccounts(updated));
                                                    if (selectedAccountId === acc.id) {
                                                        setSelectedAccountId("");
                                                        setSelectedAccountName("");
                                                        setQuery("");
                                                    }
                                                }}
                                                className="p-1 text-gray-600 hover:text-red-600 transition cursor-pointer hover:scale-110"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                {/* ====== RYG SUMMARY ====== */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border rounded-sm p-2 bg-red-50 border-red-200">
                        <div className="text-xs font-semibold text-red-700">Bereits ausgegeben</div>
                        <div className="text-lg font-bold text-red-800">{fmtMoney(expenseTotal)}</div>
                        <p className="text-[11px] text-red-700 mt-1">Bereits gebuchte Ausgaben in diesem Monat.</p>
                    </div>

                    <div className="border rounded-sm p-2 bg-yellow-50 border-yellow-200">
                        <div className="text-xs font-semibold text-yellow-700">Bald fällig</div>
                        <div className="text-lg font-bold text-yellow-800">{fmtMoney(futureTotal)}</div>
                        <p className="text-[11px] text-yellow-700 mt-1">Geplante Abbuchungen für diesen Monat.</p>
                    </div>

                    <div className="border rounded-sm p-2 bg-green-50 border-green-200">
                        <div className="text-xs font-semibold text-green-700">Verfügbar (geschätzt)</div>
                        <div className="text-lg font-bold text-green-800">{fmtMoney(available)}</div>
                        <p className="text-[11px] text-green-700 mt-1">
                            Gesamtbestand aller Konten minus geplante Abbuchungen dieses Monats.
                        </p>
                    </div>
                </section>

                {/* ====== TABLE OF MONTH TRANSACTIONS ====== */}
                <section className="flex-1 flex flex-col gap-3">
                    {monthTx.length === 0 ? (
                        <div className="card bg-base-200 p-6">
                            <p className="opacity-80 text-sm mb-3">Noch keine Transaktionen in diesem Monat.</p>
                            <Button variant="primary" icon={Plus} onClick={() => navigate("/GuestTransactionOne")}>
                                Transaktion
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <input
                                    id="only-planned"
                                    type="checkbox"
                                    checked={onlyPlanned}
                                    onChange={(e) => setOnlyPlanned(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="only-planned" className="text-sm text-gray-700">
                                    Nur geplannt
                                </label>
                            </div>

                            <div className="overflow-x-auto border shadow-sm border-gray-300 rounded-xl max-h-[60vh]">
                                <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm max-h-[60vh]">
                                    <table className="w-full border-collapse table-fixed text-sm">
                                        <thead className="sticky top-0 z-10 bg-white">
                                            <tr className="text-xs text-gray-700">
                                                <th className="border border-gray-200 px-2 py-2 text-left w-[120px]">Datum</th>
                                                <th className="border border-gray-200 px-2 py-2 text-left w-[170px]">Konto</th>
                                                <th className="border border-gray-200 px-2 py-2 text-left w-[170px]">Anbieter</th>
                                                <th className="border border-gray-200 px-2 py-2 text-left">Kategorie</th>
                                                <th className="border border-gray-200 px-2 py-2 text-right w-[130px]">Betrag</th>
                                                <th className="border border-gray-200 px-2 py-2 text-left w-[220px]">Aktion</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {tableTx.map((tx) => {
                                                const d = (tx.date ?? "").slice(0, 10);

                                                const isPlanned = tx.status === "planned";
                                                const isCancelled = tx.status === "cancelled";

                                                const isOverdue = isPlanned && d && d < todayISO;
                                                const isDueToday = isPlanned && d === todayISO;

                                                const rowClass = isCancelled
                                                    ? "bg-gray-50 text-gray-500 opacity-70"
                                                    : isOverdue
                                                        ? "bg-red-50"
                                                        : isDueToday
                                                            ? "bg-yellow-50"
                                                            : "";

                                                const amountClass = isCancelled
                                                    ? "text-gray-500 font-semibold"
                                                    : tx.kind === "income"
                                                        ? "text-green-700 font-semibold"
                                                        : "text-red-700 font-semibold";

                                                const hoverClass = rowClass ? "" : "hover:bg-gray-50";

                                                return (
                                                    <tr key={tx.id} className={`${rowClass} ${hoverClass}`}>
                                                        <td className="border border-gray-200 px-2 py-1 whitespace-nowrap align-middle">
                                                            <div className="flex items-center gap-2">
                                                                <span>{fmtDate(tx.date)}</span>

                                                                {isCancelled ? (
                                                                    <span className="text-[10px] px-2 py-[2px] rounded-full border border-gray-300 bg-gray-50 text-gray-600">
                                                                        ✖ cancelled
                                                                    </span>
                                                                ) : isPlanned ? (
                                                                    <span
                                                                        className={`text-[10px] px-2 py-[2px] rounded-full border ${isOverdue
                                                                            ? "border-red-300 bg-red-50 text-red-800"
                                                                            : isDueToday
                                                                                ? "border-yellow-300 bg-yellow-50 text-yellow-800"
                                                                                : "border-gray-300 bg-gray-50 text-gray-700"
                                                                            }`}
                                                                    >
                                                                        ⏳ planned
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </td>

                                                        <td className="border border-gray-200 px-2 py-1 align-middle">
                                                            <span className="block truncate" title={getKontoName((tx as any).kontoId ?? undefined)}>
                                                                {getKontoName((tx as any).kontoId ?? undefined)}
                                                            </span>
                                                        </td>

                                                        <td className="border border-gray-200 px-2 py-1 align-middle">
                                                            <span
                                                                className="block truncate"
                                                                title={tx.kind === "expense" ? getAnbieterName((tx as any).anbieterId ?? null) : "—"}
                                                            >
                                                                {tx.kind === "expense" ? getAnbieterName((tx as any).anbieterId ?? null) : "—"}
                                                            </span>
                                                        </td>

                                                        <td className="border border-gray-200 px-2 py-1 align-middle">
                                                            <span
                                                                className="block truncate"
                                                                title={
                                                                    tx.kind === "expense"
                                                                        ? getKategorieName((tx as any).gruppeId ?? null, (tx as any).kategorieId ?? null)
                                                                        : "—"
                                                                }
                                                            >
                                                                {tx.kind === "expense"
                                                                    ? getKategorieName((tx as any).gruppeId ?? null, (tx as any).kategorieId ?? null)
                                                                    : "—"}
                                                            </span>
                                                        </td>

                                                        <td
                                                            className={`border border-gray-200 px-2 py-1 text-right tabular-nums align-middle ${amountClass}`}
                                                        >
                                                            {fmtMoney(Number.isFinite(tx.amount) ? (tx.amount as number) : 0)}
                                                        </td>

                                                        <td className="border border-gray-200 px-2 py-1 align-middle">
                                                            {isPlanned ? (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => markBooked(tx.id)}
                                                                        className="text-xs px-2 py-1 rounded border border-green-300 bg-green-50 hover:bg-green-100"
                                                                    >
                                                                        ✅ durchführen
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => markCancelled(tx.id)}
                                                                        className="text-xs px-2 py-1 rounded border border-red-300 bg-red-50 hover:bg-red-100"
                                                                    >
                                                                        🗑 stornieren
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="py-6 flex flex-col">
                                <Button variant="primary" icon={Plus} onClick={() => navigate("/GuestTransactionOne")}>
                                    Transaktion
                                </Button>
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}
