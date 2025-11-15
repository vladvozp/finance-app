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
        if (!Number.isFinite(t.amount)) return sum;
        return sum + t.amount; // доходы +, расходы -
    }, 0);

    return (acc.openingBalance ?? 0) + delta;
}