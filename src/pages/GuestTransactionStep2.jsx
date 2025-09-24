import PageHeader from "../components/PageHeader.jsx";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import Button from "../components/Button";

import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";

import DatePickerInput from "../components/DatePickerInput";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";

export default function GuestTransactionStep2() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const { date: dateRaw } = useTxDraft();

    const date =
        dateRaw
            ? (typeof dateRaw === "string" ? new Date(dateRaw) : dateRaw)
            : null;

    function next() {
        const qs = new URLSearchParams({
            ...Object.fromEntries(params),
            date: date && !isNaN(date.getTime()) ? date.toISOString() : "",
        }).toString();
        navigate(`/guestTransactionStep3?${qs}`);
    }

    // --- state ---
    const [spinOnce, setSpinOnce] = useState(false);

    // --- handlers ---
    const onGearClick = () => {
        if (spinOnce) return;
        setSpinOnce(true);
        setTimeout(() => setSpinOnce(false), 600);
    };

    return (
        <div className="bg-white">
            {/* one-time spin animation */}
            <style>{`
        @keyframes spin-once { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .rotate-once { animation: spin-once 0.6s linear 1; }
      `}</style>

            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guestTransactionStep1"
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

                {/* content */}
                <section className="flex-1">
                    <h1 className="text-lg text-gray-600 mb-10">
                        Demo-Zugang ohne Speicherung
                    </h1>

                    <h2 className="text-center text-black text-base font-medium mb-1">
                        Datum
                    </h2>

                    <DatePickerInput
                        value={date} // Date | null
                        onChange={(val) => {
                            txDraft.set("date", val || null);
                        }}
                        placeholder="Tag/Monat/Jahr"
                        displayFormat="dd.MM.yyyy"
                    />

                    <div className="flex gap-3 mt-6">
                        <Button
                            variant="primary"
                            onClick={next}
                            disabled={!date || isNaN(date.getTime())}
                        >
                            Weiter
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    );
}
