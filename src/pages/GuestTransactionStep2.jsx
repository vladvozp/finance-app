import PageHeader from "../components/PageHeader.jsx";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Progress from "../components/Progress";

import { MoveLeft, Settings } from "lucide-react";

// import Arrowleft from "../assets/Arrowleft.svg?react";
// import Settings from "../assets/Settings.svg?react";

import DatePickerInput from "../components/DatePickerInput";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";

export default function GuestTransactionStep2() {
    const navigate = useNavigate();


    const { date: dateRaw, kind } = useTxDraft();

    const date =
        dateRaw
            ? (typeof dateRaw === "string" ? new Date(dateRaw) : dateRaw)
            : null;

    function next() {
        if (!kind) {
            alert("Bitte zuerst Einkommen oder Ausgabe auswählen!");
            return;
        }
        else {
            navigate("/guestTransactionStep3");
        }
    }

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guestTransactionStep1"
                            className="flex items-center gap-1 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <MoveLeft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }

                    center={<Progress
                        step={2}
                        total={4}
                        className="hidden sm:flex w-[120px]"
                        srLabel="Schrittfortschritt"
                    />}

                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group p-2 text-gray-600 transition inline-flex items-center justify-center"
                            type="button"
                        >
                            <Settings className="w-5 h-5 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
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
                            if (!val) { txDraft.set("date", null); return; }
                            const atNoon = new Date(val);
                            atNoon.setHours(12, 0, 0, 0);
                            txDraft.set("date", atNoon);
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
