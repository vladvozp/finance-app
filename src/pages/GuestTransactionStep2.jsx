import PageHeader from "../components/PageHeader.jsx";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Button from "../components/Button";

import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";

import DatePickerInput from "../components/DatePickerInput";
import draft from "../store/transactionDraft";

export default function GuestTransactionStep2() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [date, setDate] = useState(draft.get("date") || null);
    const [repeat, setRepeat] = useState(!!draft.get("repeat"));

    useEffect(() => {
        draft.set("date", date);
        draft.set("repeat", repeat);
    }, [date, repeat]);

    function next() {
        const qs = new URLSearchParams({
            ...Object.fromEntries(params),
            date: date ? date.toISOString() : "",
            repeat: String(repeat),
        }).toString();
        navigate(`/guestTransactionStep3?${qs}`);
    }

    // --- state ---
    const [spinOnce, setSpinOnce] = useState(false);


    // --- effects ---
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
                        value={date}
                        onChange={setDate}
                        label="Datum"
                        placeholder="MM/DD/YYYY"
                        displayFormat="dd.MM.yyy"
                    />

                    <div className="flex items-center justify-between border p-3 mb-10">
                        <span className="text-sm font-medium">Wiederholen</span>
                        <button
                            type="button"
                            onClick={() => setRepeat(r => !r)}
                            className={`h-7 w-12 rounded-full transition ${repeat ? "bg-blue-400" : "bg-gray-300"
                                }`}
                        >
                            <span className={`block h-7 w-7 rounded-full bg-white transition ${repeat ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>


                    <Button
                        variant="primary"
                        onClick={next}
                        disabled={!date}
                    >
                        Weiter
                    </Button>
                </section>
            </main>
        </div>
    );
}
