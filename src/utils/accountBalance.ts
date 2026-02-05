// src/utils/accountBalance.ts
import type { Tx } from "../types/tx";

export type AccountLike = {
    id: string;
    openingBalance?: number;
    snapshotBalance?: number;
    snapshotAt?: string | null;
    openingDate?: string | null;
};

function isoDateOnly(iso?: string | null): string | null {
    if (!iso) return null;
    // "2026-02-04T12:34:56.000Z" -> "2026-02-04"
    if (iso.length >= 10) return iso.slice(0, 10);
    return null;
}

export function computeAccountBalance(acc: AccountLike, allTx: Tx[]): number {
    const base =
        Number.isFinite(acc.snapshotBalance) ? (acc.snapshotBalance as number) : (acc.openingBalance ?? 0);

    const cutISO = acc.snapshotAt ?? null;


    const delta = allTx.reduce((sum, t) => {
        if (!t) return sum;
        if (t.kontoId !== acc.id) return sum;

        // only booked affects real balance
        if (t.status && t.status !== "booked") return sum;

        // IMPORTANT: use createdAt for snapshot cut (time-aware)
        if (cutISO) {
            // If tx has createdAt, compare full ISO strings (works lexicographically)
            if (t.createdAt) {
                if (t.createdAt <= cutISO) return sum;
            } else {
                // fallback (old tx without createdAt): treat as BEFORE snapshot to avoid double-subtract
                return sum;
            }
        }


        const amt = Number(t.amount);
        if (!Number.isFinite(amt)) return sum;

        const a = Math.abs(amt);
        const signedAmount = t.kind === "expense" ? -a : a;

        return sum + signedAmount;
    }, 0);

    return base + delta;
}
