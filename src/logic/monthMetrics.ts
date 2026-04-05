export type TxStatus = "planned" | "booked" | "cancelled" | string;
export type TxKind = "expense" | "income" | string;

export type MonthTxLike = {
    id: string;
    date?: string | null;
    status?: TxStatus;
    kind?: TxKind;
    amount: number;
};

export type MonthMetrics<T extends MonthTxLike = MonthTxLike> = {
    monthTx: T[];
    monthBookedTx: T[];
    monthPlannedTx: T[];
    expenseTotal: number;
    plannedExpenseTotal: number;
    plannedIncomeTotal: number;
    monthEndForecast: number;
};

function safeAmount(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function calculateMonthMetrics<T extends MonthTxLike>(
    transactions: T[],
    selectedMonthPrefix: string,
    totalBalance: number
): MonthMetrics<T> {
    const monthTx = transactions.filter((tx) =>
        (tx.date ?? "").startsWith(selectedMonthPrefix)
    );

    const monthBookedTx = monthTx.filter(
        (tx) => tx.status !== "planned" && tx.status !== "cancelled"
    );

    const monthPlannedTx = monthTx.filter((tx) => tx.status === "planned");

    const expenseTotal = monthBookedTx.reduce((sum, tx) => {
        if (tx.kind !== "expense") return sum;
        return sum + Math.abs(safeAmount(tx.amount));
    }, 0);

    const plannedExpenseTotal = monthPlannedTx.reduce((sum, tx) => {
        if (tx.kind !== "expense") return sum;
        return sum + Math.abs(safeAmount(tx.amount));
    }, 0);

    const plannedIncomeTotal = monthPlannedTx.reduce((sum, tx) => {
        if (tx.kind !== "income") return sum;
        return sum + safeAmount(tx.amount);
    }, 0);

    const monthEndForecast = totalBalance - plannedExpenseTotal + plannedIncomeTotal;

    return {
        monthTx,
        monthBookedTx,
        monthPlannedTx,
        expenseTotal,
        plannedExpenseTotal,
        plannedIncomeTotal,
        monthEndForecast,
    };
}