// src/store/accounts.ts
import { create } from "zustand";
import type { Account } from "../types/account";
import type { Tx } from "../types/tx";
import { computeAccountBalance } from "../utils/accountBalance";
import {
    fetchAccounts,
    fetchTransactions,
    insertAccount,
    updateAccountInDb,
    deleteAccountFromDb,
    insertTransaction,
    updateTransactionInDb,
    deleteTransactionFromDb,
} from "../repositories/supabaseAccountRepository";

const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `acc_${Date.now().toString(36)}`;

function createDefaultAccount(name: string, isMain = false): Account {
    const now = new Date().toISOString();
    return {
        id: newId(),
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

function ensureOneMain(list: Account[]): Account[] {
    const hasMain = list.some((a) => a.isMain);
    if (!hasMain && list.length > 0) {
        return list.map((a, i) => ({ ...a, isMain: i === 0 }));
    }
    return list;
}

export type AccountWithBalance = Account & { balance: number };

type AccountsState = {
    accounts: Account[];
    transactions: Tx[];
    loaded: boolean;

    loadFromSupabase: () => Promise<void>;
    clearAll: () => void;

    addAccount: (name: string, isMain?: boolean) => Promise<Account>;
    updateAccount: (id: string, patch: Partial<Account>) => Promise<void>;
    removeAccount: (id: string) => Promise<void>;

    addTransaction: (tx: Tx) => Promise<void>;
    updateTransaction: (id: string, patch: Partial<Tx>) => Promise<void>;
    removeTransaction: (id: string) => Promise<void>;
    setTransactions: (txs: Tx[]) => void;

    getAccountsWithBalance: () => AccountWithBalance[];
    getTotalBalance: () => number;
};

export const useAccountsStore = create<AccountsState>()((set, get) => ({
    accounts: [],
    transactions: [],
    loaded: false,

    loadFromSupabase: async () => {
        try {
            set({ loaded: false });

            const [accounts, transactions] = await Promise.all([
                fetchAccounts(),
                fetchTransactions(),
            ]);

            set({
                accounts: ensureOneMain(accounts),
                transactions,
                loaded: true,
            });
        } catch (e) {
            console.error("Supabase load error:", e);
            set({
                accounts: [],
                transactions: [],
                loaded: true,
            });
        }
    },

    clearAll: () =>
        set({
            accounts: [],
            transactions: [],
            loaded: false,
        }),

    addAccount: async (name, isMain = false) => {
        const acc = createDefaultAccount(name, isMain);
        await insertAccount(acc);
        set((s) => ({ accounts: ensureOneMain([...s.accounts, acc]) }));
        return acc;
    },

    updateAccount: async (id, patch) => {
        set((s) => ({
            accounts: s.accounts.map((a) =>
                a.id === id
                    ? { ...a, ...patch, updatedAt: new Date().toISOString() }
                    : a
            ),
        }));
        await updateAccountInDb(id, patch);
    },

    removeAccount: async (id) => {
        set((s) => ({
            accounts: ensureOneMain(s.accounts.filter((a) => a.id !== id)),
        }));
        await deleteAccountFromDb(id);
    },

    addTransaction: async (tx) => {
        set((s) => ({ transactions: [...s.transactions, tx] }));
        await insertTransaction(tx);
    },

    updateTransaction: async (id, patch) => {
        set((s) => ({
            transactions: s.transactions.map((t) =>
                t.id === id ? { ...t, ...patch } : t
            ),
        }));
        await updateTransactionInDb(id, patch);
    },

    removeTransaction: async (id) => {
        set((s) => ({
            transactions: s.transactions.filter((t) => t.id !== id),
        }));
        await deleteTransactionFromDb(id);
    },

    setTransactions: (transactions) => set({ transactions }),

    getAccountsWithBalance: () => {
        const { accounts, transactions } = get();
        return accounts.map((acc) => ({
            ...acc,
            balance: computeAccountBalance(acc, transactions),
        }));
    },

    getTotalBalance: () => {
        const { accounts, transactions } = get();
        return accounts.reduce(
            (sum, acc) => sum + computeAccountBalance(acc, transactions),
            0
        );
    },
}));