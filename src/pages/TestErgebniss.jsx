// src/pages/TestErgebniss.jsx
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";
import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";
import Plus from "../assets/Plus.svg?react";
import Barchart2 from "../assets/Barchart2.svg?react";
import Confirm from "../assets/Confirm.svg?react";

import { useState, useEffect, useMemo, useRef } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";

export default function TestErgebniss() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    // settings gear spin
    const [spinOnce, setSpinOnce] = useState(false);
    const onGearClick = () => {
        if (spinOnce) return;
        setSpinOnce(true);
        setTimeout(() => setSpinOnce(false), 600);
    };

    const {
        kind = "expense",        // "expense" | "income"
        amount = "",             //  "12,34"
        amountCents = 0,
        accountId = "",
        kontoName = "",
        gruppeId = "",
        anbieterId = "",
        kategorieId = "",
        remark = "",
        date: dateRaw = null,
        repeat = false,
    } = useTxDraft();


    const fmtEur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
    const fmtDate = (d) => (d ? new Intl.DateTimeFormat("de-DE").format(d) : "—");


    const paramOr = (key, fallback) => (params.get(key) ?? fallback);


    const isExpense = (paramOr("type", kind) === "expense") || kind === "expense";


    const centsFromQuery = params.get("amountCents");
    const effectiveCents =
        (centsFromQuery != null && /^\d+$/.test(centsFromQuery))
            ? parseInt(centsFromQuery, 10)
            : (Number.isFinite(amountCents) && amountCents > 0 ? amountCents : null);

    let amountNum;
    if (effectiveCents != null) {
        const euros = effectiveCents / 100;
        amountNum = isExpense ? -Math.abs(euros) : Math.abs(euros);
    } else {
        const parsed = Number(String(paramOr("amount", amount)).replace(",", "."));
        amountNum = Number.isFinite(parsed) ? (isExpense ? -Math.abs(parsed) : Math.abs(parsed)) : NaN;
    }
    const amountView = Number.isFinite(amountNum) ? fmtEur.format(amountNum) : "—";


    const dateObj = useMemo(() => {
        const s = paramOr("date", dateRaw);
        const d = s ? new Date(s) : null;
        return d && !isNaN(d.getTime()) ? d : null;
    }, [dateRaw, params]);
    const dateView = fmtDate(dateObj);


    const gruppeName = paramOr("gruppeName", "") || gruppeId || "—";
    const anbieterName = paramOr("anbieterName", "") || anbieterId || "—";
    const kategorieName = paramOr("kategorieName", "") || kategorieId || "—";
    const kontoLabel = kontoName || accountId || "—";


    const errors = [];
    if (!Number.isFinite(amountNum)) errors.push("Betrag ungültig");
    if (!gruppeId) errors.push("Gruppe fehlt");
    if (!kategorieId) errors.push("Kategorie fehlt");
    const canSave = errors.length === 0;

    function saveTransaction() {
        if (!canSave) return;

        const tx = {
            id: `txn_${Date.now()}`,
            kind: isExpense ? "expense" : "income",
            amount: amountNum,
            kontoId: accountId || null,
            gruppeId,
            anbieterId: anbieterId || null,
            kategorieId,
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



    return (<div className="bg-white">
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

            <div className="border p-4 space-y-2">
                <Row label="Gruppe" value={gruppeName} />
                <Row label="Anbieter" value={anbieterName} />
                <Row label="Kategorie" value={kategorieName} />
                <Row label="Bemerkung" value={remark || "—"} />
                <Row label="Konto" value={kontoLabel} />
                <Row label="Betrag" value={amountView} />
                <Row label="Datum" value={dateView} />
                <Row label="Wiederholen" value={(typeof repeat === "string" ? repeat === "true" : repeat) ? "Ja" : "Nein"} />
            </div>

            {!canSave && (
                <div className="text-sm text-red-600">
                    Bitte prüfen: {errors.join(" · ")}
                </div>
            )}
            <div className="space-y-5 pt-15">
                <Button variant="primary" icon={Confirm} disabled={!canSave} onClick={saveTransaction} >Speichern</Button>
                <Button variant="secondary" icon={Plus} onClick={() => navigate("/guestTransactionStep1")} >Transaktion</Button>
                <Button variant="secondary" icon={Barchart2}>Dashboard</Button>
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
