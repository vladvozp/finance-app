// src/utils/storage.ts

import type { Tx } from "../types/tx";


const TX_KEY = "ft_transactions";

export function readTxList(): Tx[] {
    try {
        const raw = localStorage.getItem(TX_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function writeTxList(list: Tx[]) {
    localStorage.setItem(TX_KEY, JSON.stringify(list));
}