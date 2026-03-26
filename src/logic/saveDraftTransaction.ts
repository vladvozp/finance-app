import { txDraft } from "../store/transactionDraft";
import type { Tx, TxStatus } from "../types/tx";

export type SaveDraftResult = {
    ok: boolean;
    errors?: string[];
    duplicate?: boolean;
    tx?: Tx;
};

const TX_KEY = "ft_transactions";

function readTxList(): Tx[] {
    try {
        const raw = localStorage.getItem(TX_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function writeTxList(list: Tx[]): void {
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
    anbieterId?: string;
    quelleId?: string;
    incomeKategorieId?: string;
    remark?: string;
    repeat?: unknown;
    status?: string;
}): string {
    return [
        d.kind ?? "",
        d.amount ?? "",
        d.amountCents ?? "",
        d.date ?? "",
        d.accountId ?? "",
        d.gruppeId ?? "",
        d.anbieterId ?? "",
        d.quelleId ?? "",
        d.incomeKategorieId ?? "",
        (d.remark ?? "").trim(),
        String(!!d.repeat),
        d.status ?? "",
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
        anbieterId,
        quelleId,
        incomeKategorieId,
        remark,
        date: dateRaw = null,
        repeat = false,
        isPlanned = false,
    } = draft;

    const status: TxStatus = isPlanned ? "planned" : "booked";
    const isExpense = kind === "expense";
    const isIncome = kind === "income";

    const centsValid =
        typeof amountCents === "number" &&
            Number.isFinite(amountCents) &&
            amountCents > 0
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

    let dateObj: Date | null = null;

    if (dateRaw) {
        if (typeof dateRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
            const [y, m, d] = dateRaw.split("-").map(Number);
            dateObj = new Date(y, m - 1, d);
        } else {
            const parsed =
                typeof dateRaw === "string" ? new Date(dateRaw) : (dateRaw as Date);
            if (parsed && !isNaN(parsed.getTime())) {
                dateObj = parsed;
            }
        }
    }

    const dateStore: string | null = dateObj ? toYMD(dateObj) : null;

    const errors: string[] = [];

    if (amountNum == null) errors.push("Betrag ungültig");
    if (!dateStore) errors.push("Datum fehlt");

    if (isExpense) {
        if (!gruppeId) errors.push("Gruppe fehlt");
    }

    if (isIncome) {
        if (!quelleId) errors.push("Quelle fehlt");
        if (!incomeKategorieId) errors.push("Kategorie fehlt");
    }

    const dedupeKey = `dedupe:${draftHash({
        kind,
        amount,
        amountCents,
        date: dateStore,
        accountId,
        gruppeId,
        anbieterId,
        quelleId,
        incomeKategorieId,
        remark,
        repeat,
        status,
    })}`;

    if (sessionStorage.getItem(dedupeKey)) {
        return { ok: true, duplicate: true };
    }

    const nowISO = new Date().toISOString();

    const base = {
        id: `txn_${Date.now()}`,
        kind: isExpense ? "expense" : "income",
        amount: amountNum ?? 0,
        date: dateStore,
        kontoId: accountId || null,
        remark: (remark ?? "").trim() || null,
        repeat: !!(typeof repeat === "string" ? repeat === "true" : repeat),
        status,
        createdAt: nowISO,
    } as const;

    const tx: Tx = isIncome
        ? {
            ...base,
            quelleId: quelleId || null,
            incomeKategorieId: incomeKategorieId || null,
        }
        : {
            ...base,
            gruppeId: gruppeId || undefined,
            anbieterId: anbieterId || undefined,
        };

    const list = readTxList();
    list.push(tx);
    writeTxList(list);

    sessionStorage.setItem(dedupeKey, "1");
    txDraft.set("lastSavedId", tx.id);

    return { ok: true, duplicate: false, tx };
}