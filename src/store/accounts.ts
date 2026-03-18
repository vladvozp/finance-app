// src/store/accounts.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Account } from "../types/account";
import type { Tx } from "../types/tx";
import { computeAccountBalance } from "../utils/accountBalance";

// ---- Utils ----
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

// ---- Types ----
export type AccountWithBalance = Account & { balance: number };

type AccountsState = {
    accounts: Account[];
    transactions: Tx[];

    // Accounts
    addAccount: (name: string, isMain?: boolean) => Account;
    updateAccount: (id: string, patch: Partial<Account>) => void;
    removeAccount: (id: string) => void;

    // Transactions
    addTransaction: (tx: Tx) => void;
    updateTransaction: (id: string, patch: Partial<Tx>) => void;
    setTransactions: (txs: Tx[]) => void;
    removeTransaction: (id: string) => void;

    // Computed
    getAccountsWithBalance: () => AccountWithBalance[];
    getTotalBalance: () => number;
};

export const useAccountsStore = create<AccountsState>()(
    persist(
        (set, get) => ({
            accounts: [],
            transactions: [],

            // ---- Accounts ----
            addAccount: (name, isMain = false) => {
                const acc = createDefaultAccount(name, isMain);
                set((s) => ({
                    accounts: ensureOneMain([...s.accounts, acc]),
                }));
                return acc;
            },

            updateAccount: (id, patch) =>
                set((s) => ({
                    accounts: s.accounts.map((a) =>
                        a.id === id
                            ? { ...a, ...patch, updatedAt: new Date().toISOString() }
                            : a
                    ),
                })),

            removeAccount: (id) =>
                set((s) => ({
                    accounts: ensureOneMain(s.accounts.filter((a) => a.id !== id)),
                })),

            // ---- Transactions ----
            addTransaction: (tx) =>
                set((s) => ({ transactions: [...s.transactions, tx] })),

            updateTransaction: (id, patch) =>
                set((s) => ({
                    transactions: s.transactions.map((t) =>
                        t.id === id ? { ...t, ...patch } : t
                    ),
                })),

            setTransactions: (transactions) => set({ transactions }),

            removeTransaction: (id) =>
                set((s) => ({
                    transactions: s.transactions.filter((t) => t.id !== id),
                })),

            // ---- Computed ----
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
        }),
        {
            name: "ft_accounts_v1",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accounts: state.accounts,
                transactions: state.transactions,
            }),
        }
    )
);