
/** Domain model for a transaction kept in LocalStorage. */
export type Tx = {
    id: string;
    kind: "expense" | "income";
    amount: number;        // expense: negative, income: positive
    date: string | null;   // YYYY-MM-DD or null
    // EXPENSE-only
    gruppeId?: string;
    kategorieId?: string;
    anbieterId?: string | null;
    // INCOME-only
    incomeType?: "GEHALT" | "RENTE" | "MIETE" | "VERKAUF" | "GESCHЕНК" | "SONSTIGES";
    quelleId?: string | null;
    quelleName?: string | null;
    // COMMON
    kontoId?: string | null;
    remark?: string | null;
    repeat?: boolean;
};