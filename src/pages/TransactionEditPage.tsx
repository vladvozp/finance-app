// src/pages/TransactionEditPage.tsx
import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAccountsStore } from "../store/accounts";
import { useDicts } from "../store/dicts";
import { txDraft } from "../store/transactionDraft";
import { toCents, fmtEur } from "../utils/currency";
import { Combobox, type ComboOption } from "../components/ui/combobox";
import DatePickerInput from "../components/DatePickerInput";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { MoveLeft, Save, Edit3 } from "lucide-react";
import type { TxStatus } from "../types/tx";

type Provider = ComboOption & {};
type Group = ComboOption & {};

export default function TransactionEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { transactions, updateTransaction } = useAccountsStore();
    const tx = transactions.find(t => t.id === id);

    const {
        gruppen, createGroup, renameGroup, deleteGroup,
        createProvider, renameProvider, deleteProvider,
    } = useDicts();
    const anbieter = useDicts((s) => s.anbieter);

    // Redirect if not found
    useEffect(() => {
        if (!tx) navigate("/MonthPage");
    }, [tx]);

    const [amountStr, setAmountStr] = useState(
        tx ? Math.abs(tx.amount).toLocaleString("de-DE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) : ""
    );
    const [date, setDate] = useState<Date | null>(
        tx?.date ? new Date(tx.date) : new Date()
    );
    const [isPlanned, setIsPlanned] = useState(tx?.status === "planned");
    const [gruppeId, setGruppeId] = useState(tx?.gruppeId ?? "");
    const [anbieterId, setAnbieterId] = useState(tx?.anbieterId ?? "");
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
            setAmountStr((cents / 100).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }));
        }
    };

    const canSave = toCents(amountStr) > 0 && date !== null;

    const handleSave = async () => {
        if (!canSave || saving || !tx) return;
        setSaving(true);

        const cents = toCents(amountStr);
        const isoDate = date!.toISOString().slice(0, 10);
        const status: TxStatus = isPlanned ? "planned" : "booked";

        await updateTransaction(tx.id, {
            amount: -(cents / 100),
            date: isoDate,
            status,
            gruppeId: gruppeId || undefined,
            anbieterId: anbieterId || undefined,
            remark: remark || undefined,
        });

        setSaving(false);
        navigate("/MonthPage");
    };

    const onProviderChange = useCallback((id: string) => {
        setAnbieterId(id);
    }, []);

    const onGroupChange = useCallback((id: string) => {
        setGruppeId(id);
    }, []);

    const comboboxRef = useRef<HTMLDivElement | null>(null);
    const [showNotiz, setShowNotiz] = useState(false);

    if (!tx) return null;

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link to="/MonthPage"
                            className="flex items-center gap-1 text-sm text-gray-600 underline hover:text-gray-800">
                            <MoveLeft className="w-5 h-5" />Zurück
                        </Link>
                    }
                    center={null}
                    right={null}
                />

                <h1 className="text-lg text-gray-600 mb-6">Transaktion bearbeiten</h1>

                {/* Amount */}
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
                <div className="mt-6">
                    <h2 className="text-center text-black text-base font-medium mb-1">Datum</h2>
                    <DatePickerInput
                        value={date}
                        onChange={setDate}
                        label
                        minDate={new Date(2020, 0, 1)}
                        maxDate={new Date(2030, 11, 31)}
                        placeholder="Tag/Monat/Jahr"
                        displayFormat="dd.MM.yyyy"
                    />
                    <div className="mt-3 flex items-center gap-2">
                        <input id="tx-planned" type="checkbox" checked={isPlanned}
                            onChange={(e) => setIsPlanned(e.target.checked)} className="h-4 w-4" />
                        <label htmlFor="tx-planned" className="text-sm text-gray-700">Geplant</label>
                    </div>
                </div>

                {/* Provider */}
                <section className="flex-1" ref={comboboxRef}>

                    <Combobox<Provider>
                        label=""
                        options={anbieter}
                        value={anbieterId}
                        onChange={onProviderChange}
                        placeholder="z. B. Rewe, Aral, Amazon"
                        allowCreate
                        onCreate={async (name) => {
                            const id = await createProvider(name, "");
                            setAnbieterId(id);
                        }}
                        allowEdit
                        onEdit={(id, newName) => renameProvider(id, newName)}
                        onDelete={(id) => {
                            deleteProvider(id);
                            if (anbieterId === id) setAnbieterId("");
                        }}
                    />

                    {/* Group */}
                    <Combobox<Group>
                        label="Gruppe"
                        options={gruppen}
                        value={gruppeId}
                        onChange={onGroupChange}
                        placeholder="Gruppe wählen…"
                        allowCreate
                        onCreate={async (name) => {
                            const id = await createGroup(name);
                            setGruppeId(id);
                        }}
                        allowEdit
                        onEdit={(id, newName) => renameGroup(id, newName)}
                        onDelete={(id) => {
                            deleteGroup(id);
                            if (gruppeId === id) setGruppeId("");
                        }}
                    />


                    <div className="flex gap-3 mt-6" />
                    {/* Remark */}
                    {!showNotiz ? (
                        <button onClick={() => setShowNotiz(true)}>
                            + Notiz hinzufügen
                        </button>
                    ) : (


                        <div className="relative">
                            <textarea
                                value={remark}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v.length <= 100) txDraft.set("remark", v);
                                }}
                                placeholder="Optionale Notiz (z. B. 'für Schule' …)"
                                className="w-full h-24 border pl-3 pr-3 py-2 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none outline-none placeholder-gray-400"
                                maxLength={100}
                            />
                            <span className="absolute bottom-1 right-3 text-xs text-gray-500">
                                {remark.length}/100
                            </span>
                        </div>
                    )}


                    <div className="mt-6">
                        <Button variant="primary" icon={Save} disabled={!canSave || saving} onClick={handleSave}>
                            {saving ? "Speichern…" : "Speichern"}
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    );
}