import { useMemo, useState } from "react";
import DatePickerInput from "../components/DatePickerInput";

type Props = {
    value: Date | null;
    onChange: (data: { date: Date | null; status: "booked" | "planned" }) => void;
};

function startOfDayLocal(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getAutoStatus(date: Date | null): "booked" | "planned" {
    if (!date) return "booked";

    const selected = startOfDayLocal(date);
    const today = startOfDayLocal(new Date());

    return selected > today ? "planned" : "booked";
}

export default function TransactionDateField({ value, onChange }: Props) {
    const [date, setDate] = useState<Date | null>(value);
    const [statusOverride, setStatusOverride] = useState<"booked" | "planned" | null>(null);

    const autoStatus = useMemo(() => getAutoStatus(date), [date]);
    const effectiveStatus = statusOverride ?? autoStatus;
    const isPlanned = effectiveStatus === "planned";

    function handleDateChange(next: Date | null) {
        setDate(next);
        setStatusOverride(null);

        onChange({
            date: next,
            status: getAutoStatus(next),
        });
    }
    function toggleStatus() {
        setStatusOverride((prev) => {
            const current = prev ?? autoStatus;
            const next = current === "planned" ? "booked" : "planned";

            onChange({
                date,
                status: next,
            });

            return next;
        });
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <DatePickerInput
                        value={date}
                        onChange={handleDateChange}
                        label
                        placeholder="Tag/Monat/Jahr"
                        displayFormat="dd.MM.yyyy"
                        minDate={new Date(2020, 0, 1)}
                        maxDate={new Date(2030, 11, 31)}
                    />
                </div>

                <button
                    type="button"
                    onClick={toggleStatus}
                    className={[
                        "h-10 rounded-full border px-4 text-sm font-medium transition whitespace-nowrap",
                        isPlanned
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700"
                    ].join(" ")}
                >
                    {isPlanned ? "Geplant" : "Heute"}
                </button>
            </div>

            <p className="text-xs text-gray-500">
                {statusOverride
                    ? `Manuell gesetzt: ${isPlanned ? "Geplant" : "Heute"}`
                    : autoStatus === "planned"
                        ? "Automatisch als geplant erkannt"
                        : "Wird sofort verbucht"}
            </p>
        </div>
    );
}