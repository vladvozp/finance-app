// src/hooks/useIncomeTransactionForm.ts
import { useState, ChangeEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { txDraft } from "../store/transactionDraft";
import { toCents } from "../utils/currency";
import type { Tx, TxStatus } from "../types/tx";
import { useAccountsStore } from "../store/accounts";

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
            const isoDate = effectiveDate.toISOString().slice(0, 10);
            const status: TxStatus = isPlanned ? "planned" : "booked";

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