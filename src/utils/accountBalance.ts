import type { Tx } from "../types/tx";

export type AccountLike = {
    id: string;
    openingBalance?: number;
};

/**
 * Calculates the current balance for a single account.
 *
 * The opening balance is treated as the initial source of funds.
 * Only booked transactions affect the real account balance.
 *
 * Snapshot-based calculations are intentionally not used here.
 * Any balance discrepancy should be handled through a dedicated
 * correction transaction instead of modifying the balance directly.
 */
export function computeAccountBalance(
    acc: AccountLike,
    allTx: Tx[]
): number {
    const baseBalance = Number.isFinite(acc.openingBalance)
        ? (acc.openingBalance as number)
        : 0;

    const transactionDelta = allTx.reduce((sum, tx) => {
        if (!tx) return sum;

        // Ignore transactions belonging to another account.
        if (tx.kontoId !== acc.id) return sum;

        // Only booked transactions affect the actual account balance.
        if (tx.status && tx.status !== "booked") return sum;

        const amount = Number(tx.amount);

        // Ignore invalid transaction amounts.
        if (!Number.isFinite(amount)) return sum;

        const absoluteAmount = Math.abs(amount);

        // Expenses decrease the balance, all other transaction types increase it.
        const signedAmount =
            tx.kind === "expense"
                ? -absoluteAmount
                : absoluteAmount;

        return sum + signedAmount;
    }, 0);

    return baseBalance + transactionDelta;
}