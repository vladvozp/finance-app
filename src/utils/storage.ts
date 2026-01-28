// src/utils/storage.ts

import type { Tx, TxStatus } from "../types/tx";


const TX_KEY = "ft_transactions";

function normalizeTx(raw: any): Tx {
    const status: TxStatus =
        raw.status ??
        (raw.isPlanned === true && raw.isDone !== true ? "planned" : "booked");

    return { ...raw, status } as Tx;
}

export function readTxList(): Tx[] {
    try {
        const raw = localStorage.getItem(TX_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(arr) ? arr : [];
        return list.map(normalizeTx);
    } catch {
        return [];
    }
}

export function writeTxList(list: Tx[]): void {
    localStorage.setItem(TX_KEY, JSON.stringify(list));
}

export function updateTxStatus(id: string, status: TxStatus): Tx[] {
    const list = readTxList();
    const next = list.map((tx) => (tx.id === id ? { ...tx, status } : tx));
    writeTxList(next);
    return next;
}
