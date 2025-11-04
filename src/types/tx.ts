
/** Domain model for a transaction kept in LocalStorage. */
export type Tx = {
    id: string;
    kind: "expense" | "income";
    amount: number;
    date: string | null;

    // EXPENSE-only
    gruppeId?: string;
    kategorieId?: string;
    anbieterId?: string | null;

    // INCOME-only
    incomeType?: "GEHALT" | "RENTE" | "MIETE" | "VERKAUF" | "GESCHENK" | "SONSTIGES";
    quelleId?: string | null;
    quelleName?: string | null;

    // COMMON
    kontoId?: string | null;
    // konto?: string; // лучше НЕ хранить; подставлять из словаря при выводе
    remark?: string | null;
    repeat?: boolean;
};
