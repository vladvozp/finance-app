// src/utils/accountBalance.ts

import type { Tx } from "../types/tx";

export type AccountLike = {
    id: string;
    openingBalance?: number;
};
export function computeAccountBalance(acc: AccountLike, allTx: Tx[]): number {
    const delta = allTx.reduce((sum, t) => {
        if (!t) return sum;
        if (t.kontoId !== acc.id) return sum;

        const amt = Number(t.amount);
        if (!Number.isFinite(amt)) return sum;

        const a = Math.abs(amt);
        const signedAmount = t.kind === "expense" ? -a : a;

        return sum + signedAmount;
    }, 0);

    return (acc.openingBalance ?? 0) + delta;
}

