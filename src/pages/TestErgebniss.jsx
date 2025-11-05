// src/pages/TestErgebniss.jsx
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";
import Progress from "../components/Progress";

// import Arrowleft from "../assets/Arrowleft.svg?react";
// import Settings from "../assets/Settings.svg?react";
// import Plus from "../assets/Plus.svg?react";
// import Barchart2 from "../assets/Barchart2.svg?react";
// import Check from "../assets/Check.svg?react";


import { ChartNoAxesColumn, Plus, MoveLeft, Save, Settings, Trash2 } from "lucide-react";


import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";

const KEY = "ft_transactions";

/** Utility: stable YYYY-MM-DD from Date */
function toYMD(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Utility: shallow, safe read of transactions from LS */
function readTxList() {
    try {
        const raw = localStorage.getItem(KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

/** Utility: write list back to LS */
function writeTxList(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
}

/** Utility: simple content hash (good enough for idempotency in demo) */
function draftHash(d) {
    return [
        d.kind ?? "",
        d.amount ?? "",
        d.amountCents ?? "",
        d.date ?? "",
        d.accountId ?? "",
        d.gruppeId ?? "",
        d.kategorieId ?? "",
        d.anbieterId ?? "",
        d.incomeType ?? "",
        d.quelleId ?? "",
        (d.quelleName ?? "").trim(),
        (d.remark ?? "").trim(),
        String(!!d.repeat),
    ].join("|");
}

export default function TestErgebniss() {
    const navigate = useNavigate();

    // Pull full draft (includes both expense and income fields)
    const {
        kind,                 // "expense" | "income"
        amount,               // string | number
        amountCents = 0,      // integer cents if already normalized earlier
        accountId,
        kontoName,

        // EXPENSE-only
        gruppeId,
        anbieterId,
        kategorieId,

        // INCOME-only
        incomeType,           // "GEHALT" | "RENTE" | ...
        quelleId,
        quelleName,

        remark,
        date: dateRaw = null, // string | Date | null
        repeat = false,       // boolean | "true"/"false"

        // lastSavedId is updated after a successful persist
        lastSavedId,
    } = useTxDraft();

    const isExpense = kind === "expense";
    const isIncome = kind === "income";

    // Formatting helpers (DE locale)
    const fmtEur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
    const fmtDate = (d) => (d ? new Intl.DateTimeFormat("de-DE").format(d) : "—");

    // Normalize amount:
    // - prefer amountCents (authoritative) if > 0
    // - else parse "amount" (accept comma decimals)
    // - sign: negative for expense, positive for income
    const centsValid = Number.isFinite(amountCents) && amountCents > 0 ? amountCents : null;

    let amountNum;
    if (centsValid != null) {
        const euros = centsValid / 100;
        amountNum = isExpense ? -Math.abs(euros) : Math.abs(euros);
    } else if (amount != null && amount !== "") {
        const parsed = Number(String(amount).replace(",", "."));
        amountNum = Number.isFinite(parsed) ? (isExpense ? -Math.abs(parsed) : Math.abs(parsed)) : undefined;
    } else {
        amountNum = undefined;
    }
    const amountView = amountNum != null ? fmtEur.format(amountNum) : "—";

    // Normalize date from string|Date|null → Date|null and stable YYYY-MM-DD for storage
    const dateObj = useMemo(() => {
        if (!dateRaw) return null;
        if (typeof dateRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
            const [y, m, d] = dateRaw.split("-").map(Number);
            return new Date(y, m - 1, d);
        }
        const d = typeof dateRaw === "string" ? new Date(dateRaw) : dateRaw;
        return d && !isNaN(d.getTime()) ? d : null;
    }, [dateRaw]);

    const dateView = fmtDate(dateObj);
    const dateStore = dateObj ? toYMD(dateObj) : null;

    // Labels for UI
    const kontoLabel = kontoName || accountId || "—";
    const gruppeName = gruppeId || "";
    const anbieterName = anbieterId || "";
    const kategorieName = kategorieId || "";

    // ==== Validation (strict, but minimal) ====
    const errors = [];
    if (amountNum == null) errors.push("Betrag ungültig");
    if (!dateStore) errors.push("Datum fehlt");

    if (isExpense) {
        if (!gruppeId) errors.push("Gruppe fehlt");
        if (!kategorieId) errors.push("Kategorie fehlt");
    }

    if (isIncome) {
        if (!incomeType) errors.push("Typ (Einnahme) fehlt");
        if (!quelleId && !quelleName) errors.push("Quelle fehlt");
    }

    const canSave = errors.length === 0;

    // Idempotency guards
    const [saving, setSaving] = useState(false);
    const dedupeKey = "dedupe:" + draftHash({
        kind, amount, amountCents, date: dateStore, accountId, gruppeId, kategorieId, anbieterId,
        incomeType, quelleId, quelleName, remark, repeat
    });

    /** Persist one transaction into LocalStorage (MVP).
     *  Best practice notes:
     *  - single "save" point (on Ergebnis only)
     *  - idempotent (prevents double-click duplicates)
     *  - writes only relevant fields for the selected kind
     */
    function saveTransaction() {
        if (!canSave || saving) return;
        if (sessionStorage.getItem(dedupeKey)) {
            alert("Schon gespeichert ✅");
            return;
        }
        setSaving(true);

        const base = {
            id: `txn_${Date.now()}`,             // In production use UUID/nanoid
            kind: isExpense ? "expense" : "income",
            amount: amountNum ?? 0,
            date: dateStore,                     // YYYY-MM-DD (timezone-safe)
            kontoId: accountId || null,
            remark: (remark ?? "").trim(),
            repeat: !!(typeof repeat === "string" ? repeat === "true" : repeat),
        };

        const tx = isIncome
            ? {
                ...base,
                // expense fields intentionally null for income
                gruppeId: null,
                anbieterId: null,
                kategorieId: null,
                // income detail
                incomeType: incomeType || null,
                quelleId: quelleId || null,
                quelleName: (quelleName ?? "").trim() || null,
            }
            : {
                ...base,
                // expense detail
                gruppeId: gruppeId || null,
                anbieterId: anbieterId || null,
                kategorieId: kategorieId || null,
                // income fields intentionally null
                incomeType: null,
                quelleId: null,
                quelleName: null,
            };

        const list = readTxList();
        list.push(tx);
        writeTxList(list);

        sessionStorage.setItem(dedupeKey, "1"); // prevent duplicates in same session
        txDraft.set("lastSavedId", tx.id);      // handy for post-save actions
        setSaving(false);

        // In production, use a toast system instead of alert
        alert("Erfolgreich gespeichert ✅");
    }

    /** Delete a transaction by id from LocalStorage (MVP).
     *  - Safe if item doesn't exist (no-op).
     *  - After delete, we clear lastSavedId to avoid confusion.
     */
    function deleteTransactionById(id) {
        const list = readTxList();
        const next = list.filter(t => t.id !== id);
        writeTxList(next);
        if (lastSavedId === id) txDraft.set("lastSavedId", "");
        alert("Gelöscht ✅");
    }

    const canDelete = Boolean(lastSavedId);

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guestTransactionStep3"
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <MoveLeft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }

                    center={<Progress
                        step={4}
                        total={4}
                        className="hidden sm:flex w-[120px]"
                        srLabel="Schrittfortschritt"
                    />}

                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group p-2 transition rounded-lg inline-flex items-center justify-center"
                            type="button"
                        >
                            <Settings className="block transform h-5 w-5 text-gray-600 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />

                {/* Review card (what exactly will be persisted) */}
                <div className="border shadow-sm p-4 space-y-2">
                    {/* Common fields */}
                    <Row label="Konto" value={kontoLabel} />
                    <Row label="Betrag" value={amountView} />
                    <Row label="Datum" value={dateView} />
                    <Row
                        label="Wiederholen"
                        value={(typeof repeat === "string" ? repeat === "true" : repeat) ? "Ja" : "Nein"}
                    />

                    {/* Expense-only preview */}
                    {isExpense && !!gruppeName && <Row label="Gruppe" value={gruppeName} />}
                    {isExpense && !!anbieterName && <Row label="Anbieter" value={anbieterName} />}
                    {isExpense && !!kategorieName && <Row label="Kategorie" value={kategorieName} />}

                    {/* Income-only preview */}
                    {isIncome && <Row label="Typ (Einnahme)" value={incomeType || "—"} />}
                    {isIncome && (
                        <Row
                            label="Quelle"
                            value={(quelleName && quelleName.trim()) || quelleId || "—"}
                        />
                    )}

                    {/* Both */}
                    <Row label="Bemerkung" value={(remark ?? "") || "—"} />
                </div>

                {/* Validation summary */}
                {!canSave && (
                    <div className="text-sm text-red-600 mt-2">
                        Bitte prüfen: {errors.join(" · ")}
                    </div>
                )}

                <div className="space-y-3 pt-6">
                    <Button
                        variant="primary"
                        icon={Save}
                        disabled={!canSave || saving}
                        onClick={saveTransaction}
                    >
                        {saving ? "Speichern…" : "Speichern"}
                    </Button>

                    {/* Delete last saved (optional control) */}
                    <Button
                        variant="secondary"
                        icon={Trash2}
                        disabled={!canDelete}
                        onClick={() => {
                            if (!lastSavedId) return;
                            if (confirm("Diesen Eintrag wirklich löschen?")) {
                                deleteTransactionById(lastSavedId);
                            }
                        }}
                    >
                        Letzten Eintrag löschen
                    </Button>

                    <Button variant="secondary" icon={Plus} onClick={() => navigate("/guestTransactionStep1")}>
                        Transaktion
                    </Button>
                    <Button variant="secondary" icon={ChartNoAxesColumn} onClick={() => navigate("/Dashboard")}>
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
