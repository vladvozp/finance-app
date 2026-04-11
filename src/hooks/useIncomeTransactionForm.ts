// src/hooks/useIncomeTransactionForm.ts
import { useState, ChangeEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { txDraft } from "../store/transactionDraft";
import { toCents } from "../utils/currency";
import type { Tx, TxStatus } from "../types/tx";
import { useAccountsStore } from "../store/accounts";

function formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function generateMonthlyDates(start: string, until: string, interval: number): string[] {
    const dates: string[] = [];

    let current = new Date(start);
    const end = new Date(until);

    while (current <= end) {
        dates.push(formatLocalDate(current));

        const next = new Date(current);
        next.setMonth(next.getMonth() + interval);

        if (next.getDate() !== current.getDate()) {
            next.setDate(0);
        }

        current = next;
    }

    return dates;
}

export function useIncomeTransactionForm(
    amount: number,
    selectedAccountId: string,
    selectedAccountName: string,
    quelleId: string,
    incomeKategorieId: string,
    remark: string,
) {
    const navigate = useNavigate();
    const addTransaction = useAccountsStore((s) => s.addTransaction);

    const [date, setDate] = useState<Date | null>(new Date());
    const [isPlanned, setIsPlanned] = useState(false);
    const [saving, setSaving] = useState(false);

    const [amountStr, setAmountStr] = useState<string>(
        typeof amount === "number" && amount > 0
            ? amount.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
            : ""
    );

    const onAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        const cleaned = v.replace(/[^\d.,\s]/g, "");
        const normalized = cleaned.replace(/\./g, ",");
        setAmountStr(normalized);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (["-", "e", "E", "+"].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleBlur = () => {
        const cents = toCents(amountStr);

        if (cents <= 0) {
            txDraft.setMany({ amount: 0, amountCents: 0 });
            setAmountStr("");
            return;
        }

        const euros = cents / 100;

        txDraft.setMany({
            amount: euros,
            amountCents: cents,
        });

        setAmountStr(
            euros.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
        );
    };

    const canSave =
        toCents(amountStr) > 0 &&
        !!selectedAccountId &&
        !!quelleId &&
        !!incomeKategorieId &&
        date !== null;

    const handleSave = () => {
        if (!canSave || saving) return;

        setSaving(true);

        try {
            const cents = toCents(amountStr);
            const effectiveDate = date ?? new Date();
            const nowISO = new Date().toISOString();
            const isoDate = formatLocalDate(effectiveDate);
            const status: TxStatus = isPlanned ? "planned" : "booked";

            const isRepeat = txDraft.getField("repeat");
            const repeatFreq = txDraft.getField("repeat_freq");
            const repeatInterval = txDraft.getField("repeat_interval");
            const repeatUntil = txDraft.getField("repeat_until");

            if (!isRepeat) {
                const tx: Tx = {
                    id: crypto.randomUUID(),
                    kind: "income",
                    kontoId: selectedAccountId,
                    amount: cents / 100,
                    date: isoDate,
                    createdAt: nowISO,
                    status,
                    quelleId: quelleId || null,
                    incomeKategorieId: incomeKategorieId || null,
                    remark: remark?.trim() || null,
                };

                addTransaction(tx);

                txDraft.setMany({
                    kind: "income",
                    kontoId: selectedAccountId,
                    amount: tx.amount,
                    date: isoDate,
                    createdAt: nowISO,
                    status,
                    accountId: selectedAccountId,
                    kontoName: selectedAccountName,
                    quelleId,
                    incomeKategorieId,
                    remark,
                });

                alert("Saved ✅");
                navigate("/MonthPage");
            } else {
                if (!repeatUntil) {

                    const tx: Tx = {
                        id: crypto.randomUUID(),
                        kind: "income",
                        kontoId: selectedAccountId,
                        amount: cents / 100,
                        date: isoDate,
                        createdAt: nowISO,
                        status,
                        quelleId: quelleId || null,
                        incomeKategorieId: incomeKategorieId || null,
                        remark: remark?.trim() || null,
                    };

                    addTransaction(tx);

                    alert("Saved ✅");
                    navigate("/MonthPage");
                    return;
                }

                if (repeatFreq !== "MONTHLY") {
                    console.log("REPEAT ERROR: only MONTHLY supported now");
                    return;
                }

                const dates = generateMonthlyDates(
                    isoDate,
                    String(repeatUntil),
                    Number(repeatInterval) || 1
                );

                const repeatTxs: Tx[] = dates.map((d, index) => ({
                    id: crypto.randomUUID(),
                    kind: "income",
                    kontoId: selectedAccountId,
                    amount: cents / 100,
                    date: d,
                    createdAt: nowISO,
                    status: index === 0 ? status : "planned",
                    quelleId: quelleId || null,
                    incomeKategorieId: incomeKategorieId || null,
                    remark: remark?.trim() || null,
                }));

                repeatTxs.forEach((tx) => addTransaction(tx));

                alert("Saved ✅");
                navigate("/MonthPage");
                return;
            }
        } finally {
            setSaving(false);
        }
    };

    return {
        date,
        setDate,
        isPlanned,
        setIsPlanned,
        saving,
        amountStr,
        onAmountChange,
        handleKeyDown,
        handleBlur,
        canSave,
        handleSave,
    };
}