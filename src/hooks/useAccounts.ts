// src/hooks/useAccounts.ts
import { useState, useEffect, useMemo } from "react";
import { useAccountsStore } from "../store/accounts";
import type { Account } from "../types/account";

export type AccountWithBalance = Account & { balance: number };

export function useAccounts(
    accountId: string,
    query: string,
    setQuery: (q: string) => void,
) {
    const { accounts, getAccountsWithBalance, getTotalBalance } = useAccountsStore();

    const [account, setAccount] = useState<Account | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [selectedAccountName, setSelectedAccountName] = useState<string>("");

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

    // Prefill from draft if account still exists
    useEffect(() => {
        if (!accountId || accounts.length === 0) return;
        const acc = accounts.find((a) => a.id === accountId);
        if (acc) {
            setSelectedAccountId(acc.id);
            setSelectedAccountName(acc.name);
            setQuery(acc.name);
        }
    }, [accountId, accounts]);

    const accountsWithBalance: AccountWithBalance[] = useMemo(
        () => getAccountsWithBalance(),
        [accounts]
    );

    const totalBalance = useMemo(
        () => getTotalBalance(),
        [accounts]
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
        setAccounts: useAccountsStore.getState().setTransactions, // не нужен, но для совместимости
        selectedAccountId,
        setSelectedAccountId,
        selectedAccountName,
        setSelectedAccountName,
        accountsWithBalance,
        totalBalance,
        filtered,
    };
}