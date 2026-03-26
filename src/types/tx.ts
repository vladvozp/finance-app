export type TxStatus = "planned" | "booked" | "cancelled";

export type Tx = {
    id: string;

    kind: "expense" | "income";
    status: TxStatus;

    amount: number;
    date: string | null;
    createdAt?: string;

    kontoId?: string | null;

    // expense
    gruppeId?: string;
    anbieterId?: string | null;

    // income
    quelleId?: string | null;
    incomeKategorieId?: string | null;

    // common
    remark?: string | null;
    repeat?: boolean;
};