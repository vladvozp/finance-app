// src/logic/saveDraftTransaction.ts
import { txDraft } from "../store/transactionDraft";
import type { TxStatus } from "../types/tx";

export type SaveDraftResult = {
    ok: boolean;
    errors?: string[];
    duplicate?: boolean;
    tx?: any;
};

const TX_KEY = "ft_transactions";

function normalizeTx(raw: any) {
    const status: TxStatus =
        raw.status ??
        (raw.isPlanned === true && raw.isDone !== true ? "planned" : "booked");

    return { ...raw, status };
}




function readTxList(): any[] {
    try {
        const raw = localStorage.getItem(TX_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(arr) ? arr : [];
        return list.map(normalizeTx);
    } catch {
        return [];
    }
}

function writeTxList(list: any[]): void {
    localStorage.setItem(TX_KEY, JSON.stringify(list));
}

function toYMD(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}

function draftHash(d: {
    kind?: string;
    amount?: number | string;
    amountCents?: number;
    date?: string | null;
    accountId?: string;
    gruppeId?: string;
    kategorieId?: string;
    anbieterId?: string;
    incomeType?: string;
    quelleId?: string;
    quelleName?: string;
    remark?: string;
    repeat?: unknown;
    isPlanned?: boolean;
    isDone?: boolean;



}): string {
    return [
        d.kind ?? "",
        d.amount ?? "",
        d.amountCents ?? "",
        d.date ?? "",
        d.accountId ?? "",
        d.gruppeId ?? "",
        d.kategorieId ?? "",
        d.anbieterId ?? "",
        d.incomeType ?? "",
        d.quelleId ?? "",
        (d.quelleName ?? "").trim(),
        (d.remark ?? "").trim(),
        String(!!d.repeat),
        String(!!d.isPlanned),
        String(!!d.isDone),
    ].join("|");
}

export function saveDraftTransaction(): SaveDraftResult {
    const draft = txDraft.get() as any;

    const {
        kind,
        amount,
        amountCents = 0,
        accountId,
        gruppeId,
        kategorieId,
        anbieterId,
        incomeType,
        quelleId,
        quelleName,
        remark,
        date: dateRaw = null,
        repeat = false,
        isPlanned = false,
        isDone = false,
    } = draft;

    const status: TxStatus = isPlanned ? "planned" : "booked";
    const isExpense = kind === "expense";
    const isIncome = kind === "income";

    // --- amount normalization ---
    const centsValid =
        typeof amountCents === "number" && Number.isFinite(amountCents) && amountCents > 0
            ? amountCents
            : null;

    let amountNum: number | undefined;
    if (centsValid != null) {
        const euros = centsValid / 100;
        amountNum = isExpense ? -Math.abs(euros) : Math.abs(euros);
    } else if (amount != null && amount !== "") {
        const parsed = Number(String(amount).replace(",", "."));
        amountNum = Number.isFinite(parsed)
            ? isExpense
                ? -Math.abs(parsed)
                : Math.abs(parsed)
            : undefined;
    } else {
        amountNum = undefined;
    }

    // --- date normalization ---
    let dateObj: Date | null = null;
    if (dateRaw) {
        if (typeof dateRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
            const [y, m, d] = dateRaw.split("-").map((n) => Number(n));
            dateObj = new Date(y, m - 1, d);
        } else {
            const parsed = typeof dateRaw === "string" ? new Date(dateRaw) : (dateRaw as Date);
            if (parsed && !isNaN(parsed.getTime())) dateObj = parsed;
        }
    }
    const dateStore: string | null = dateObj ? toYMD(dateObj) : null;

    // --- validation ---
    const errors: string[] = [];
    if (amountNum == null) errors.push("Betrag ungültig");
    if (!dateStore) errors.push("Datum fehlt");

    // For income we still enforce type + source
    if (isIncome) {
        if (!incomeType) errors.push("Typ (Einnahme) fehlt");
        const hasQuelleName = typeof quelleName === "string" && quelleName.trim().length > 0;
        if (!quelleId && !hasQuelleName) errors.push("Quelle fehlt");
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    // --- dedupe key ---
    const dedupeKey = `dedupe:${draftHash({
        kind,
        amount,
        amountCents,
        date: dateStore,
        accountId,
        gruppeId,
        kategorieId,
        anbieterId,
        incomeType,
        quelleId,
        quelleName,
        remark,
        repeat,
    })}`;

    if (sessionStorage.getItem(dedupeKey)) {
        return { ok: true, duplicate: true };
    }

    // --- build tx ---
    const base = {
        id: `txn_${Date.now()}`,
        kind: isExpense ? "expense" : "income",
        amount: amountNum ?? 0,
        date: dateStore,
        kontoId: accountId || null,
        remark: (remark ?? "").trim(),
        repeat: !!(typeof repeat === "string" ? repeat === "true" : repeat),
        status,
        isPlanned: !!isPlanned,
        isDone: !!isDone,
    };

    const tx =
        isIncome
            ? {
                ...base,
                gruppeId: null,
                anbieterId: null,
                kategorieId: null,
                incomeType: incomeType || null,
                quelleId: quelleId || null,
                quelleName: (quelleName ?? "").trim() || null,
            }
            : {
                ...base,
                gruppeId: gruppeId || null,
                anbieterId: anbieterId || null,
                kategorieId: kategorieId || null,
                incomeType: null,
                quelleId: null,
                quelleName: null,
            };

    const list = readTxList();
    list.push(tx);
    writeTxList(list);

    sessionStorage.setItem(dedupeKey, "1");
    txDraft.set("lastSavedId", (tx as any).id);

    return { ok: true, duplicate: false, tx };
}
