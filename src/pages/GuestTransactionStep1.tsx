// src/pages/GuestTransactionStep1.tsx
import React, {
    useState,
    useEffect,
    useMemo,
    useRef,
    ChangeEvent,
    KeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";
import Progress from "../components/Progress";
import {
    ChevronsDown,
    MoveLeft,
    Edit3,
    Trash2,
    SquarePlus,
    SquareMinus,
    Plus,
    Settings,
    Search,
    Delete,
} from "lucide-react";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";
import type { Tx } from "../types/tx";
import { computeAccountBalance } from "../utils/accountBalance";

const ACC_KEY = "ft_accounts";
const TX_KEY = "ft_transactions";

type Kind = "expense" | "income";

export interface Account {
    id: string;
    name: string;
    currency: string;
    openingBalance?: number;
    openingDate: string | null;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
}

type AccountWithBalance = Account & { balance: number };

// ---------- Helpers ----------
const fmtEur = (n: number): string =>
    new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(n);

// Parse "1.000,00" → 100000 cents, "1000" → 100000 cents, "12,3" → 1230 cents
const toCents = (s: string | number): number => {
    if (!s && s !== 0) return 0;
    const cleaned = String(s)
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

// Create a new account object with sane defaults
function createDefaultAccount(name: string): Account {
    const now = new Date().toISOString();
    const id = crypto?.randomUUID ? crypto.randomUUID() : `acc_${Date.now()}`;
    return {
        id,
        name,
        currency: "EUR",
        openingBalance: 0,
        openingDate: null,
        archived: false,
        createdAt: now,
        updatedAt: now,
    };
}

// Ensure ft_accounts exists and has at least one account
export function ensureAccounts(): Account[] {
    try {
        const raw = localStorage.getItem(ACC_KEY);
        if (!raw) {
            const seed = [createDefaultAccount("Bargeld")];
            localStorage.setItem(ACC_KEY, JSON.stringify(seed));
            return seed;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            const seed = [createDefaultAccount("Bargeld")];
            localStorage.setItem(ACC_KEY, JSON.stringify(seed));
            return seed;
        }
        return parsed as Account[];
    } catch {
        const seed = [createDefaultAccount("Bargeld")];
        localStorage.setItem(ACC_KEY, JSON.stringify(seed));
        return seed;
    }
}

// Quick create (replace with modal later)
function createNewAccountInteractive(
    onPicked?: (acc: Account) => void
): Account[] | null {
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

    const exists = list.some(
        (a) => a.name.trim().toLowerCase() === name.toLowerCase()
    );

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

// Edit opening balance (current balance stays computed)
function editOpeningBalanceInteractive(
    accId: string,
    currentOpening: number | undefined,
    onDone?: (updated: Account, all: Account[]) => void
): Account[] | null {
    const input = window.prompt(
        "Anfangssaldo (EUR):",
        String(currentOpening ?? 0)
    );
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

    list[idx] = {
        ...list[idx],
        openingBalance: n,
        updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(ACC_KEY, JSON.stringify(list));
    if (typeof onDone === "function") onDone(list[idx], list);
    return list;
}

// persisted delete helper
function deleteAccountInteractive(
    accId: string,
    onDone?: (next: Account[]) => void
): Account[] | null {
    const accRaw = localStorage.getItem(ACC_KEY);
    const accounts: Account[] = accRaw ? JSON.parse(accRaw) : [];

    const txRaw = localStorage.getItem(TX_KEY);
    const tx: Tx[] = txRaw ? JSON.parse(txRaw) : [];

    const acc = accounts.find((a) => a.id === accId);
    if (!acc) return null;

    const txCount = tx.filter((t) => t && t.kontoId === accId).length;
    if (txCount > 0) {
        alert(
            `Konto "${acc.name}" hat ${txCount} Buchung(en). Es kann nicht gelöscht werden.`
        );
        return null;
    }

    const balance = computeAccountBalance(acc, tx);

    if (balance !== 0) {
        alert(
            `Konto "${acc.name}" kann nur gelöscht werden, wenn der Kontostand 0,00 € ist.`
        );
        return null;
    }

    if (!window.confirm(`Konto "${acc.name}" wirklich löschen?`)) return null;

    const next = accounts.filter((a) => a.id !== accId);
    localStorage.setItem(ACC_KEY, JSON.stringify(next));

    if (typeof onDone === "function") onDone(next);
    return next;
}

// ---------- Page ----------
const GuestTransactionStep1: React.FC = () => {
    const navigate = useNavigate();

    const {
        amount = "",
        accountId = "",
        kind = "expense",
    } = useTxDraft() as {
        amount?: number;
        accountId?: string;
        kind?: Kind;
    };

    const [query, setQuery] = useState<string>("");
    const [open, setOpen] = useState<boolean>(false);
    const [showAll, setShowAll] = useState<boolean>(false);
    const comboboxRef = useRef<HTMLDivElement | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempBalance, setTempBalance] = useState<string>("");

    const [accounts, setAccounts] = useState<Account[]>([]);

    const [amountStr, setAmountStr] = useState<string>(
        typeof amount === "number" && amount > 0
            ? amount.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
            : ""
    );

    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [selectedAccountName, setSelectedAccountName] = useState<string>("");

    // Ensure accounts
    useEffect(() => {
        const accs = ensureAccounts();
        setAccounts(accs);
    }, []);

    // Prefill selection from store if account still exists
    useEffect(() => {
        if (!accountId || accounts.length === 0) return;
        const acc = accounts.find((a) => a.id === accountId);
        if (acc) {
            setSelectedAccountId(acc.id);
            setSelectedAccountName(acc.name);
            setQuery(acc.name);
        }
    }, [accountId, accounts]);

    // close combobox on outside click
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!open) return;
            if (
                comboboxRef.current &&
                !comboboxRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    // compute balances per account from transactions
    const accountsWithBalance: AccountWithBalance[] = useMemo(() => {
        let tx: Tx[] = [];
        try {
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
        return accountsWithBalance.filter((a) =>
            a.name.toLowerCase().includes(q)
        );
    }, [query, accountsWithBalance]);

    // --- handlers ---
    const onAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        const cleaned = v.replace(/[^\d.,\s]/g, "");
        const normalized = cleaned.replace(/\./g, ",");
        setAmountStr(normalized);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
    };

    const handleBlur = () => {
        const cents = toCents(amountStr);
        if (cents <= 0) {
            txDraft.setMany({ amount: 0, amountCents: 0 });
            setAmountStr("");
        } else {
            const euros = cents / 100;
            txDraft.setMany({ amount: euros, amountCents: cents });
            setAmountStr(
                euros.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            );
        }
    };

    const onKindChange = (nextKind: Kind) => {
        txDraft.set("kind", nextKind);
    };

    const onAccountPick = (acc: { id: string; name: string }) => {
        setSelectedAccountId(acc.id);
        setSelectedAccountName(acc.name);
        setQuery(acc.name);
        setOpen(false);
        txDraft.setMany({ accountId: acc.id, kontoName: acc.name });
    };

    const onNext = () => {
        const cents = toCents(amountStr);
        const nowISO = new Date().toISOString();

        txDraft.setMany({
            kind,
            amount: cents / 100,
            amountCents: cents,
            date: nowISO,
            accountId: selectedAccountId || "",
            kontoName: selectedAccountName || "",
        });

        navigate("/guestTransactionStep2");
    };

    const canContinue = toCents(amountStr) > 0 && !!selectedAccountId;

    const startEdit = (acc: AccountWithBalance) => {
        setEditingId(acc.id);
        const current = acc.openingBalance ?? 0;
        setTempBalance(String(current));
    };

    const saveEdit = (accId: string) => {
        const valueNum = Number(String(tempBalance).replace(",", "."));
        if (Number.isNaN(valueNum)) {
            setEditingId(null);
            return;
        }
        editOpeningBalanceInteractive(accId, valueNum, (_, l) => setAccounts(l));
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guest"
                            className="flex items-center gap-1 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <MoveLeft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={
                        <Progress
                            step={1}
                            total={4}
                            className="hidden sm:flex w-[120px]"
                            srLabel="Schrittfortschritt"
                        />
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

                <section className="flex-1">
                    <h1 className="text-lg text-gray-600 mb-6">Transaktion anlegen</h1>

                    {/* kind toggle */}
                    <h2 className="text-center text-black text-base font-medium mb-1">
                        Transaktionstyp
                    </h2>
                    <div className="flex w-full shadow-sm overflow-hidden">
                        <button
                            type="button"
                            aria-pressed={kind === "expense"}
                            onClick={() => onKindChange("expense")}
                            className={`flex items-center justify-center gap-2 w-1/2 h-12 text-center font-medium transition border border-gray-400
      ${kind === "expense"
                                    ? "bg-blue-400 text-white"
                                    : "bg-white text-blue-600 hover:bg-blue-50"
                                }`}
                        >
                            <SquareMinus
                                className={`w-5 h-5 transition ${kind === "expense" ? "text-red-300" : "text-red-500"
                                    }`}
                            />
                            Ausgabe
                        </button>

                        <button
                            type="button"
                            aria-pressed={kind === "income"}
                            onClick={() => onKindChange("income")}
                            className={`flex items-center justify-center gap-2 w-1/2 h-12 text-center font-medium transition border border-gray-400 border-l-0
      ${kind === "income"
                                    ? "bg-blue-400 text-white"
                                    : "bg-white text-blue-600 hover:bg-blue-50"
                                }`}
                        >
                            <SquarePlus
                                className={`w-5 h-5 transition ${kind === "income" ? "text-green-300" : "text-green-500"
                                    }`}
                            />
                            Einnahme
                        </button>
                    </div>

                    {/* amount */}
                    <div className="mt-6">
                        <h2 className="text-center text-black text-base font-medium mb-1">
                            Betrag eingeben
                        </h2>
                        <input
                            inputMode="decimal"
                            placeholder="0,00"
                            value={amountStr}
                            onChange={onAmountChange}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            className="h-12 w-full border shadow-sm border-gray-400 px-3 placeholder-gray-400 outline-none
               focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                            aria-label="Betrag"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Nur positive Beträge. Beispiel: 12,99
                        </p>
                    </div>
                </section>

                {/* account selection */}
                <section className="mt-6" ref={comboboxRef}>
                    <h2 className="text-center text-black text-base font-medium mb-1">
                        Konto auswählen
                    </h2>

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
                        <div
                            className="relative z-20"
                            role="listbox"
                            id="account-listbox"
                            aria-label="Kontoliste"
                        >
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
                                                <span className="tabular-nums">
                                                    {fmtEur(acc.balance || 0)}
                                                </span>
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
                        <span>
                            {showAll ? "Alle Konten verbergen" : "Alle Konten anzeigen"}
                        </span>
                    </button>

                    {showAll && (
                        <div className="mt-3 shadow-sm border border-gray-200 p-3">
                            <div className="flex items-center justify-between mb-2">
                                <strong>Kontenübersicht</strong>
                                <span className="text-sm text-gray-600">
                                    Gesammelt: {fmtEur(totalBalance)}
                                </span>
                            </div>

                            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto pr-1">
                                {accountsWithBalance.map((acc) => (
                                    <li
                                        key={acc.id}
                                        className="py-2 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    renameAccountInteractive(
                                                        acc.id,
                                                        acc.name,
                                                        (_, l) => setAccounts(l)
                                                    );
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
                                                    {fmtEur(acc.balance ?? 0)}
                                                </span>
                                            )}

                                            <button
                                                type="button"
                                                title="Konto löschen"
                                                aria-label="Konto löschen"
                                                onClick={() => {
                                                    const next = deleteAccountInteractive(acc.id, (updated) =>
                                                        setAccounts(updated)
                                                    );
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

                    <div className="pt-10" />

                    <Button
                        variant="primary"
                        disabled={!canContinue}
                        onClick={onNext}
                        className={`${!canContinue
                                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:opacity-95 active:scale-95"
                            }`}
                    >
                        Weiter
                    </Button>
                </section>
            </main>
        </div>
    );
};

export default GuestTransactionStep1;
