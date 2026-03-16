// src/repositories/accountRepository.ts
import type { Account } from "../types/account";
import type { Tx } from "../types/tx";
import { computeAccountBalance } from "../utils/accountBalance";

const ACC_KEY = "ft_accounts";
const TX_KEY = "ft_transactions";

// Create default account
export function createDefaultAccount(name: string, isMain = false): Account {
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

// Ensure ft_accounts exists and has at least one account
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
            list = list.map((a, idx) => ({ ...a, isMain: idx === 0 }));
        }

        const mainIndices = list
            .map((a, i) => (a.isMain ? i : -1))
            .filter((i) => i >= 0);

        if (mainIndices.length > 1) {
            const keep = mainIndices[0];
            list = list.map((a, idx) => ({ ...a, isMain: idx === keep }));
        }

        localStorage.setItem(ACC_KEY, JSON.stringify(list));
        return list;
    } catch {
        const seed = [createDefaultAccount("Hauptkonto", true)];
        localStorage.setItem(ACC_KEY, JSON.stringify(seed));
        return seed;
    }
}

function loadAccounts(): Account[] {
    try {
        const raw = localStorage.getItem(ACC_KEY) || "[]";
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function saveAccounts(list: Account[]): void {
    localStorage.setItem(ACC_KEY, JSON.stringify(list));
}

// Quick create (replace with modal later)
export function createNewAccountInteractive(
    onPicked?: (acc: Account) => void
): Account[] | null {
    const rawName = window.prompt("Enter account name:", "New account");
    if (!rawName) return null;
    const name = rawName.trim();
    if (!name) return null;

    const list = loadAccounts();
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
    saveAccounts(next);
    if (typeof onPicked === "function") onPicked(newAcc);
    return next;
}

export function renameAccountInteractive(
    accId: string,
    currentName: string,
    onDone?: (updated: Account, all: Account[]) => void
): Account[] | null {
    const nextName = (window.prompt("Neuer Kontoname:", currentName) || "").trim();
    if (!nextName || nextName === currentName) return null;

    const list = loadAccounts();
    const idx = list.findIndex((a) => a.id === accId);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], name: nextName, updatedAt: new Date().toISOString() };
    saveAccounts(list);
    if (typeof onDone === "function") onDone(list[idx], list);
    return list;
}

export function editOpeningBalanceInteractive(
    accId: string,
    currentOpening: number | undefined,
    onDone?: (updated: Account, all: Account[]) => void
): Account[] | null {
    const input = window.prompt("Anfangssaldo (EUR):", String(currentOpening ?? 0));
    if (input == null) return null;
    const n = Number(String(input).replace(",", "."));
    if (!Number.isFinite(n)) { alert("Ungültiger Betrag"); return null; }

    const list = loadAccounts();
    const idx = list.findIndex((a) => a.id === accId);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], openingBalance: n, updatedAt: new Date().toISOString() };
    saveAccounts(list);
    if (typeof onDone === "function") onDone(list[idx], list);
    return list;
}

export function editSnapshotBalanceInteractive(
    accId: string,
    currentSnapshot: number | undefined,
    onDone?: (updated: Account, all: Account[]) => void
): Account[] | null {
    const input = window.prompt("Kontostand JETZT (EUR):", String(currentSnapshot ?? 0));
    if (input == null) return null;
    const n = Number(String(input).replace(",", "."));
    if (!Number.isFinite(n)) { alert("Ungültiger Betrag"); return null; }

    const list = loadAccounts();
    const idx = list.findIndex((a) => a.id === accId);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    list[idx] = { ...list[idx], snapshotBalance: n, snapshotAt: now, updatedAt: now };
    saveAccounts(list);
    if (typeof onDone === "function") onDone(list[idx], list);
    return list;
}

export function deleteAccountInteractive(
    accId: string,
    onDone?: (next: Account[]) => void
): Account[] | null {
    const accounts = loadAccounts();
    const txRaw = localStorage.getItem(TX_KEY);
    const tx: Tx[] = txRaw ? JSON.parse(txRaw) : [];

    const acc = accounts.find((a) => a.id === accId);
    if (!acc) return null;

    const txCount = tx.filter((t) => t && t.kontoId === accId).length;
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
    saveAccounts(next);
    if (typeof onDone === "function") onDone(next);
    return next;
}