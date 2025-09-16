// src/pages/GuestTransactionStep3.jsx
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import draft from "../store/transactionDraft";
import { format } from "date-fns";

export default function GuestTransactionStep3() {
    const navigate = useNavigate();
    const [params] = useSearchParams();


    const type = params.get("type") || draft.get("type") || "expense";
    const amount = params.get("amount") || draft.get("amount") || "";
    const account = params.get("account") || draft.get("account") || "";
    const repeat = (params.get("repeat") ?? draft.get("repeat")) === "true" || draft.get("repeat") === true;


    const dateStr = useMemo(() => {
        const qsDate = params.get("date");
        const d = qsDate ? new Date(qsDate) : (draft.get("date") || null);
        return d && !isNaN(d) ? format(d, "MM/dd/yyyy") : "—";
    }, [params]);

    return (
        <div className="mx-auto max-w-md space-y-6 p-4">
            <h1 className="text-xl font-semibold">Step 3 — Zusammenfassung</h1>

            <div className="rounded-2xl border p-4 space-y-2">
                <Row label="Type" value={type} />
                <Row label="Amount" value={amount} />
                <Row label="Account" value={account} />
                <Row label="Date" value={dateStr} />
                <Row label="Repeat" value={repeat ? "Yes" : "No"} />
            </div>

            <div className="flex gap-3">
                <button className="rounded-xl border px-4 py-2 hover:bg-gray-50" onClick={() => navigate(-1)}>Zurück</button>
                <button className="rounded-xl bg-indigo-600 px-4 py-2 text-white" onClick={() => alert("Submit/Save TODO")}>
                    Speichern
                </button>
            </div>
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
