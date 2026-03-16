// src/hooks/useAccounts.ts
import { useState, useEffect, useMemo } from "react";
import type { Tx } from "../types/tx";
import type { Account } from "../types/account";
import { ensureAccounts } from "../repositories/accountRepository";
import { computeAccountBalance } from "../utils/accountBalance";

const TX_KEY = "ft_transactions";

export type AccountWithBalance = Account & { balance: number };

export function useAccounts(
    accountId: string,
    query: string,
    setQuery: (q: string) => void,
) {
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

    // Prefill from store if account still exists
    useEffect(() => {
        if (!accountId || accounts.length === 0) return;
        const acc = accounts.find((a) => a.id === accountId);
        if (acc) {
            setSelectedAccountId(acc.id);
            setSelectedAccountName(acc.name);
            setQuery(acc.name);
        }
    }, [accountId, accounts]);

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

    return {
        accounts,
        setAccounts,
        selectedAccountId,
        setSelectedAccountId,
        selectedAccountName,
        setSelectedAccountName,
        accountsWithBalance,
        totalBalance,
        filtered,
    };
}