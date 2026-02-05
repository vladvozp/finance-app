// src/utils/storage.ts
import type { Tx, TxStatus } from "../types/tx";

const TX_KEY = "ft_transactions";

function normalizeTx(raw: any): Tx {
    const status: TxStatus =
        raw.status ??
        (raw.isPlanned === true && raw.isDone !== true ? "planned" : "booked");

    // ✅ ensure createdAt exists (needed for snapshot-based balances)
    let createdAt = raw.createdAt;

    // try from id like "txn_1770314690696"
    if (!createdAt && typeof raw.id === "string") {
        const m = raw.id.match(/^txn_(\d+)$/);
        if (m) {
            const ms = Number(m[1]);
            if (Number.isFinite(ms)) createdAt = new Date(ms).toISOString();
        }
    }

    // fallback: if we have updatedAt, use it
    if (!createdAt && typeof raw.updatedAt === "string") createdAt = raw.updatedAt;

    // last fallback: now (avoid invisible tx)
    if (!createdAt) createdAt = new Date().toISOString();

    return { ...raw, status, createdAt } as Tx;
}
// ✅ ensures signed amount rules:
// expense => negative, income => positive
function normalizeSignedAmount(tx: Tx): Tx {
    const amount = Number.isFinite(tx.amount as any) ? (tx.amount as number) : 0;
    const hasCents = Object.prototype.hasOwnProperty.call(tx as any, "amountCents");
    const cents = hasCents && Number.isFinite((tx as any).amountCents) ? (tx as any).amountCents : null;

    if (tx.kind === "expense") {
        const next: any = { ...tx, amount: -Math.abs(amount) };
        if (cents != null) next.amountCents = -Math.abs(cents);
        return next as Tx;
    }

    if (tx.kind === "income") {
        const next: any = { ...tx, amount: Math.abs(amount) };
        if (cents != null) next.amountCents = Math.abs(cents);
        return next as Tx;
    }

    return tx;
}

export function readTxList(): Tx[] {
    try {
        const raw = localStorage.getItem(TX_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(arr) ? arr : [];
        const normalized = list.map(normalizeTx);
        localStorage.setItem(TX_KEY, JSON.stringify(normalized));

        return normalized;
    } catch {
        return [];
    }
}

export function writeTxList(list: Tx[]): void {
    localStorage.setItem(TX_KEY, JSON.stringify(list));
}

export function updateTxStatus(id: string, status: TxStatus): Tx[] {
    const list = readTxList(); // already normalized
    const nowISO = new Date().toISOString();

    const next = list.map((tx) => {
        if (tx.id !== id) return tx;

        const updated: any = {
            ...tx,
            status,
            isPlanned: status === "planned",
            updatedAt: nowISO,
        };

        // ✅ When executing planned → booked, this is a real event NOW
        if (status === "booked") {
            updated.createdAt = nowISO;

            // Optional safety: normalize signed amount
            const amt = Number(updated.amount);
            if (Number.isFinite(amt)) {
                const a = Math.abs(amt);
                updated.amount = updated.kind === "expense" ? -a : a;
            }
            if (Number.isFinite(updated.amountCents)) {
                const c = Math.abs(updated.amountCents);
                updated.amountCents = updated.kind === "expense" ? -c : c;
            }
        }

        return updated as Tx;
    });

    writeTxList(next);

    // ✅ Return fresh normalized list (guarantees createdAt, status, etc.)
    return readTxList();
}

