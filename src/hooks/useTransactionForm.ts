// src/hooks/useTransactionForm.ts
import { useState, ChangeEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { txDraft } from "../store/transactionDraft";
import { toCents } from "../utils/currency";
import { bumpProviderStats } from "../services/providerStatsService";
import { loadProviderStats, saveProviderStats, type ProviderStats } from "../repositories/providerStatsRepository";
import type { Tx, TxStatus } from "../types/tx";
import { useAccountsStore } from "../store/accounts";
import type { BudgetGroup, PaymentType } from "../store/dicts";

function formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function generateRepeatDates(
    start: string,
    until: string,
    interval: number,
    freq: "MONTHLY" | "YEARLY"
): string[] {
    const dates: string[] = [];

    let current = new Date(start);
    const end = new Date(until);

    while (current <= end) {
        dates.push(formatLocalDate(current));

        const next = new Date(current);

        if (freq === "MONTHLY") {
            next.setMonth(next.getMonth() + interval);

            if (next.getDate() !== current.getDate()) {
                next.setDate(0);
            }
        }

        if (freq === "YEARLY") {
            next.setFullYear(next.getFullYear() + interval);
        }

        current = next;
    }

    return dates;
}


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
    const [paymentType, setPaymentType] = useState<PaymentType>("normal");
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

        try {
            const cents = toCents(amountStr);
            const effectiveDate = date ?? new Date();
            const nowISO = new Date().toISOString();
            const isoDate = formatLocalDate(effectiveDate);
            const status: TxStatus = isPlanned ? "planned" : "booked";

            const isRepeat = txDraft.getField("repeat");
            const repeatFreq = txDraft.getField("repeat_freq");
            const repeatInterval = txDraft.getField("repeat_interval");
            const repeatByweekday = txDraft.getField("repeat_byweekday");
            const repeatUntil = txDraft.getField("repeat_until");
            const budgetGroupOverride =
                txDraft.getField("budgetGroupOverride") as BudgetGroup | null;




            console.log("SAVE DEBUG:", {
                isRepeat,
                repeatFreq,
                repeatInterval,
                repeatByweekday,
                repeatUntil,
            });

            if (!isRepeat) {
                const tx: Tx = {
                    id: crypto.randomUUID(),
                    kind: "expense",
                    kontoId: selectedAccountId,
                    amount: -(cents / 100),
                    date: isoDate,
                    createdAt: nowISO,
                    status,
                    paymentType,
                    gruppeId: gruppeId || undefined,
                    anbieterId: anbieterId || undefined,
                    budgetGroupOverride: budgetGroupOverride ?? null,
                };

                addTransaction(tx);

                txDraft.setMany({
                    kind: "expense",
                    kontoId: selectedAccountId,
                    amount: tx.amount,
                    date: isoDate,
                    createdAt: nowISO,
                    status,
                    paymentType,
                    accountId: selectedAccountId,
                    kontoName: selectedAccountName,
                    budgetGroupOverride: budgetGroupOverride ?? null,
                });

                if (anbieterId) {
                    const updated = bumpProviderStats(providerStats, anbieterId, gruppeId || "");
                    setProviderStats(updated);
                    saveProviderStats(updated);
                }

                alert("Saved ✅");
                navigate("/MonthPage");
            } else {
                console.log("REPEAT INPUTS:", {
                    isoDate,
                    repeatUntil,
                    repeatInterval,
                    repeatFreq,
                });

                if (!repeatUntil) {
                    const tx: Tx = {
                        id: crypto.randomUUID(),
                        kind: "expense",
                        kontoId: selectedAccountId,
                        amount: -(cents / 100),
                        date: isoDate,
                        createdAt: nowISO,
                        status,
                        paymentType,
                        gruppeId: gruppeId || undefined,
                        anbieterId: anbieterId || undefined,
                        budgetGroupOverride: budgetGroupOverride ?? null,
                    };

                    addTransaction(tx);

                    alert("Saved ✅");
                    navigate("/MonthPage");
                    return;
                }

                if (repeatFreq !== "MONTHLY" && repeatFreq !== "YEARLY") {
                    console.log("REPEAT ERROR: only MONTHLY and YEARLY supported now");
                    return;
                }

                const dates = generateRepeatDates(
                    isoDate,
                    String(repeatUntil),
                    Number(repeatInterval) || 1,
                    repeatFreq
                );

                const seriesId = crypto.randomUUID();

                const repeatTxs: Tx[] = dates.map((d, index) => ({
                    id: crypto.randomUUID(),
                    recurringSeriesId: seriesId,
                    kind: "expense",
                    kontoId: selectedAccountId,
                    amount: -(cents / 100),
                    date: d,
                    createdAt: nowISO,
                    status: index === 0 ? status : "planned",
                    paymentType,
                    gruppeId: gruppeId || undefined,
                    anbieterId: anbieterId || undefined,
                    budgetGroupOverride: budgetGroupOverride ?? null,
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
        paymentType,
        setPaymentType,
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