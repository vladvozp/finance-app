// src/hooks/useTransactionForm.ts
import { useState, ChangeEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { txDraft } from "../store/transactionDraft";
import { toCents } from "../utils/currency";
import { bumpProviderStats } from "../services/providerStatsService";
import { loadProviderStats, saveProviderStats, type ProviderStats } from "../repositories/providerStatsRepository";
import type { Tx, TxStatus } from "../types/tx";
import { useAccountsStore } from "../store/accounts";

export function useTransactionForm(
    amount: number,
    selectedAccountId: string,
    selectedAccountName: string,
    anbieterId: string,
    gruppeId: string,
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

    const [providerStats, setProviderStats] = useState<ProviderStats>(() =>
        loadProviderStats()
    );

    const onAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        const cleaned = v.replace(/[^\d.,\s]/g, "");
        const normalized = cleaned.replace(/\./g, ",");
        setAmountStr(normalized);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
    };

    const handleBlur = () => {
        const cents = toCents(amountStr);
        if (cents <= 0) {
            txDraft.setMany({ amount: 0, amountCents: 0 });
            setAmountStr("");
        } else {
            const euros = cents / 100;
            txDraft.setMany({ amount: euros, amountCents: cents });
            setAmountStr(
                euros.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            );
        }
    };

    const canSave = toCents(amountStr) > 0 && !!selectedAccountId && date !== null;

    const handleSave = () => {
        if (!canSave || saving) return;
        setSaving(true);

        const cents = toCents(amountStr);
        const effectiveDate = date ?? new Date();
        const nowISO = new Date().toISOString();
        const isoDate = effectiveDate.toISOString().slice(0, 10);
        const status: TxStatus = isPlanned ? "planned" : "booked";

        const tx: Tx = {
            id: crypto.randomUUID(),
            kind: "expense",
            kontoId: selectedAccountId,
            amount: -(cents / 100),
            date: isoDate,
            createdAt: nowISO,
            status,
            isPlanned: status === "planned",
            gruppeId: gruppeId || undefined,
            anbieterId: anbieterId || undefined,
        };

        // Сохраняем в Zustand store (persist автоматически пишет в localStorage)
        addTransaction(tx);

        // Обновляем draft для совместимости
        txDraft.setMany({
            kind: "expense",
            kontoId: selectedAccountId,
            amount: tx.amount,
            date: isoDate,
            createdAt: nowISO,
            status,
            accountId: selectedAccountId,
            kontoName: selectedAccountName,
        });

        if (anbieterId) {
            const updated = bumpProviderStats(providerStats, anbieterId, gruppeId || "");
            setProviderStats(updated);
            saveProviderStats(updated);
        }

        setSaving(false);
        alert("Saved ✅");
        navigate("/MonthPage");
    };

    return {
        date,
        setDate,
        isPlanned,
        setIsPlanned,
        saving,
        amountStr,
        providerStats,
        onAmountChange,
        handleKeyDown,
        handleBlur,
        canSave,
        handleSave,
    };
}