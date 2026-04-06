import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAccountsStore } from "../store/accounts";
import { useIncomeDicts } from "../store/incomeDicts";
import { toCents } from "../utils/currency";
import { Combobox, type ComboOption } from "../components/ui/combobox";
import DatePickerInput from "../components/DatePickerInput";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { MoveLeft, Save, Edit3 } from "lucide-react";
import type { TxStatus } from "../types/tx";
import TransactionDateField from "../components/TransactionDateField";


type IncomeSourceOption = ComboOption & {};
type IncomeCategoryOption = ComboOption & {};

export default function IncomeTransactionEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { transactions, updateTransaction } = useAccountsStore();
    const tx = transactions.find((t) => t.id === id);

    const {
        categories,
        sources,
        createCategory,
        renameCategory,
        deleteCategory,
        createSource,
        renameSource,
        deleteSource,
        loaded,
        loadFromSupabase,
    } = useIncomeDicts();

    useEffect(() => {
        if (!loaded) void loadFromSupabase();
    }, [loaded, loadFromSupabase]);

    useEffect(() => {
        if (!tx) navigate("/MonthPage");
    }, [tx, navigate]);

    const [amountStr, setAmountStr] = useState(
        tx
            ? Math.abs(tx.amount).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
            : ""
    );

    const [date, setDate] = useState<Date | null>(
        tx?.date ? new Date(tx.date) : new Date()
    );

    const [isPlanned, setIsPlanned] = useState(tx?.status === "planned");
    const [quelleId, setQuelleId] = useState(tx?.quelleId ?? "");
    const [incomeKategorieId, setIncomeKategorieId] = useState(
        tx?.incomeKategorieId ?? ""
    );
    const [remark, setRemark] = useState(tx?.remark ?? "");
    const [saving, setSaving] = useState(false);

    const onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = e.target.value.replace(/[^\d.,\s]/g, "").replace(/\./g, ",");
        setAmountStr(cleaned);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
    };

    const handleBlur = () => {
        const cents = toCents(amountStr);
        if (cents <= 0) {
            setAmountStr("");
        } else {
            setAmountStr(
                (cents / 100).toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            );
        }
    };

    const canSave =
        toCents(amountStr) > 0 &&
        date !== null &&
        !!quelleId &&
        !!incomeKategorieId;

    const handleSave = async () => {
        if (!canSave || saving || !tx) return;
        setSaving(true);

        try {
            const cents = toCents(amountStr);
            const isoDate = date!.toISOString().slice(0, 10);
            const status: TxStatus = isPlanned ? "planned" : "booked";

            await updateTransaction(tx.id, {
                amount: cents / 100,
                date: isoDate,
                status,
                quelleId: quelleId || undefined,
                incomeKategorieId: incomeKategorieId || undefined,
                remark: remark || undefined,
            });

            navigate("/MonthPage");
        } finally {
            setSaving(false);
        }
    };

    const onSourceChange = useCallback((id: string) => {
        setQuelleId(id);
    }, []);
    const comboboxRef = useRef<HTMLDivElement | null>(null);
    const [showNotiz, setShowNotiz] = useState(false);

    const onCategoryChange = useCallback((id: string) => {
        setIncomeKategorieId(id);
    }, []);

    if (!tx) return null;

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/MonthPage"
                            className="flex items-center gap-1 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <MoveLeft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={null}
                    right={null}
                />

                <section className="flex-1">
                    <input
                        autoFocus
                        inputMode="decimal"
                        placeholder="0,00 €"
                        value={amountStr}
                        onChange={onAmountChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && amountStr) {
                                handleSave();
                            }
                        }}
                        onBlur={handleBlur}
                        className="
      w-full
  text-4xl font-semibold text-center
  h-16
  bg-transparent
  outline-none
   placeholder:text-black
    "
                        aria-label=""
                    />
                </section>


                {/* Date */}
                <div className="flex gap-3 mt-6" />
                <TransactionDateField
                    value={date}
                    status={isPlanned ? "planned" : "booked"}
                    onChange={({ date, status }) => {
                        setDate(date);
                        setIsPlanned(status === "planned");
                    }}
                />

                <section className="flex-1" ref={comboboxRef}>
                    <Combobox<IncomeSourceOption>
                        label=""
                        options={sources}
                        value={quelleId}
                        onChange={onSourceChange}
                        placeholder="z. B. Arbeitgeber, Stadt, Projekt"
                        allowCreate
                        onCreate={async (name) => {
                            const id = await createSource(name);
                            setQuelleId(id);
                        }}
                        allowEdit
                        onEdit={(id, newName) => renameSource(id, newName)}
                        onDelete={(id) => {
                            deleteSource(id);
                            if (quelleId === id) setQuelleId("");
                        }}
                    />

                    <Combobox<IncomeCategoryOption>
                        label=""
                        options={categories}
                        value={incomeKategorieId}
                        onChange={onCategoryChange}
                        placeholder="Kategorie wählen…"
                        allowCreate
                        onCreate={async (name) => {
                            const id = await createCategory(name);
                            setIncomeKategorieId(id);
                        }}
                        allowEdit
                        onEdit={(id, newName) => renameCategory(id, newName)}
                        onDelete={(id) => {
                            deleteCategory(id);
                            if (incomeKategorieId === id) setIncomeKategorieId("");
                        }}
                    />


                    <div className="flex gap-3 mt-6" />

                    {!showNotiz ? (
                        <button onClick={() => setShowNotiz(true)}>
                            + Notiz hinzufügen
                        </button>
                    ) : (

                        <div className="relative">
                            <textarea
                                value={remark}
                                onChange={(e) => {
                                    if (e.target.value.length <= 100) {
                                        setRemark(e.target.value);
                                    }
                                }}
                                placeholder="Optionale Notiz…"
                                className="w-full h-24 border pl-3 pr-3 py-2 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none outline-none placeholder-gray-400"
                                maxLength={100}
                            />
                            <span className="absolute bottom-1 right-3 text-xs text-gray-500">
                                {remark.length}/100
                            </span>
                        </div>
                    )}

                    <div className="mt-6">
                        <Button
                            variant="primary"
                            icon={Save}
                            disabled={!canSave || saving}
                            onClick={handleSave}
                        >
                            {saving ? "Speichern…" : "Speichern"}
                        </Button>
                    </div>
                </section>
            </main>
        </div >
    );
} import IncomeTransactionOne from "../pages/IncomeTransactionOne.tsx"
