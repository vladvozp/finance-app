

export type TxStatus = "planned" | "booked" | "cancelled";

/** Domain model for a transaction kept in LocalStorage. */
export type Tx = {
    id: string;
    kind: "expense" | "income";
    amount: number;
    date: string | null;
    createdAt?: string;

    // NEW: lifecycle
    status: TxStatus;


    // Old Planned
    isPlanned?: boolean;   // Planned  
    isDone?: boolean;      // for planned



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
    // konto?: string;
    remark?: string | null;
    repeat?: boolean;

};
