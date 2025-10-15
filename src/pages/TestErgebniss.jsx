// src/pages/TestErgebniss.jsx
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";
import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";
import Plus from "../assets/Plus.svg?react";
import Barchart2 from "../assets/Barchart2.svg?react";
import Check from "../assets/Check.svg?react";

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";

export default function TestErgebniss() {
    const navigate = useNavigate();

    // tiny UX candy: gear spins once on click
    const [spinOnce, setSpinOnce] = useState(false);
    const onGearClick = () => {
        if (spinOnce) return;
        setSpinOnce(true);
        setTimeout(() => setSpinOnce(false), 600);
    };

    // Pull everything we need from the draft store
    const {
        kind,                 // "expense" | "income"
        amount,               // string like "12,34" or number
        amountCents = 0,      // integer cents if already normalized
        accountId,
        kontoName,
        gruppeId,
        anbieterId,
        kategorieId,
        remark,
        date: dateRaw = null, // string | Date | null
        repeat = false,       // boolean | "true"/"false"
    } = useTxDraft();

    // Formatters (DE locale)
    const fmtEur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
    const fmtDate = (d) => (d ? new Intl.DateTimeFormat("de-DE").format(d) : "—");

    // Determine transaction type strictly from store (no URL fallbacks)
    const isExpense = kind === "expense";
    const isIncome = kind === "income";

    // Normalize amount:
    // - prefer amountCents when valid
    // - otherwise parse "amount" (accept comma decimal)
    // - negative for expense, positive for income
    const effectiveCents =
        Number.isFinite(amountCents) && amountCents > 0 ? amountCents : null;

    let amountNum;
    if (effectiveCents != null) {
        const euros = effectiveCents / 100;
        amountNum = isExpense ? -Math.abs(euros) : Math.abs(euros);
    } else if (amount != null && amount !== "") {
        const parsed = Number(String(amount).replace(",", "."));
        amountNum = Number.isFinite(parsed)
            ? (isExpense ? -Math.abs(parsed) : Math.abs(parsed))
            : undefined;
    } else {
        amountNum = undefined;
    }
    const amountView = amountNum != null ? fmtEur.format(amountNum) : "—";

    // Normalize date from string|Date|null → Date|null
    const dateObj = useMemo(() => {
        if (!dateRaw) return null;
        const d = typeof dateRaw === "string" ? new Date(dateRaw) : dateRaw;
        return d && !isNaN(d.getTime()) ? d : null;
    }, [dateRaw]);
    const dateView = fmtDate(dateObj);

    // Labels (only show expense-specific fields if they actually exist)
    const kontoLabel = kontoName || accountId || "—";
    const gruppeName = gruppeId || "";
    const anbieterName = anbieterId || "";
    const kategorieName = kategorieId || "";

    // Validation:
    // - For income: ignore missing Gruppe/Kategorie (button stays enabled)
    // - For expense: require Gruppe and Kategorie if you want to enable save
    const errors = [];
    if (amountNum == null) errors.push("Betrag ungültig");
    if (isExpense) {
        if (!gruppeId) errors.push("Gruppe fehlt");
        if (!kategorieId) errors.push("Kategorie fehlt");
    }
    const canSave = errors.length === 0;

    // Persist to localStorage (MVP style) and mark last saved id in store
    function saveTransaction() {
        if (!canSave) return;

        const tx = {
            id: `txn_${Date.now()}`,
            kind: isExpense ? "expense" : "income",
            amount: amountNum ?? 0,
            kontoId: accountId || null,
            gruppeId: isExpense ? (gruppeId || null) : null,      // income → null
            anbieterId: isExpense ? (anbieterId || null) : null,  // income → null
            kategorieId: isExpense ? (kategorieId || null) : null,// income → null
            remark: remark || "",
            date: dateObj ? dateObj.toISOString() : null,
            repeat: !!(typeof repeat === "string" ? repeat === "true" : repeat),
        };

        const KEY = "ft_transactions";
        const list = JSON.parse(localStorage.getItem(KEY) || "[]");
        list.push(tx);
        localStorage.setItem(KEY, JSON.stringify(list));

        txDraft.set("lastSavedId", tx.id);
        alert("Erfolgreich gespeichert ✅");
    }

    return (
        <div className="bg-white">
            <style>{`
        @keyframes spin-once { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .rotate-once { animation: spin-once 0.6s linear 1; }
      `}</style>

            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guestTransactionStep3"
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <Arrowleft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={null}
                    right={
                        <button
                            aria-label="Einstellungen"
                            className="p-2 hover:bg-gray-100 transition"
                            onClick={onGearClick}
                            type="button"
                        >
                            <Settings className={`h-6 w-6 ${spinOnce ? "rotate-once" : ""}`} />
                        </button>
                    }
                />

                <div className="border shadow-sm p-4 space-y-2">
                    {/* Common fields for both types */}
                    <Row label="Konto" value={kontoLabel} />
                    <Row label="Betrag" value={amountView} />
                    <Row label="Datum" value={dateView} />
                    <Row
                        label="Wiederholen"
                        value={(typeof repeat === "string" ? repeat === "true" : repeat) ? "Ja" : "Nein"}
                    />

                    {/* Expense-only details (render only if present) */}
                    {isExpense && !!gruppeName && <Row label="Gruppe" value={gruppeName} />}
                    {isExpense && !!anbieterName && <Row label="Anbieter" value={anbieterName} />}
                    {isExpense && !!kategorieName && <Row label="Kategorie" value={kategorieName} />}

                    {/* Remark is safe to show for both */}
                    <Row label="Bemerkung" value={remark || "—"} />
                </div>

                {/* Show compact validation summary when blocked */}
                {!canSave && (
                    <div className="text-sm text-red-600 mt-2">
                        Bitte prüfen: {errors.join(" · ")}
                    </div>
                )}

                <div className="space-y-5 pt-6">
                    <Button variant="primary" icon={Check} disabled={!canSave} onClick={saveTransaction}>
                        Speichern
                    </Button>
                    <Button variant="secondary" icon={Plus} onClick={() => navigate("/guestTransactionStep1")}>
                        Transaktion
                    </Button>
                    <Button variant="secondary" icon={Barchart2} onClick={() => navigate("/Dashboard")}>
                        Dashboard
                    </Button>
                </div>
            </main>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium">{String(value)}</span>
        </div>
    );
}
