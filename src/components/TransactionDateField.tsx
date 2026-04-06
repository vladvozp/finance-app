import { useMemo, useState } from "react";
import DatePickerInput from "../components/DatePickerInput";

type Props = {
    value: Date | null;
    status: "booked" | "planned";
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

export default function TransactionDateField({ value, status, onChange }: Props) {


    const autoStatus = useMemo(() => getAutoStatus(value), [value]);
    const effectiveStatus = autoStatus;
    const isPlanned = effectiveStatus === "planned";

    function handleDateChange(next: Date | null) {
        onChange({
            date: next,
            status: getAutoStatus(next),
        });
    }



    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <DatePickerInput
                        value={value}
                        onChange={handleDateChange}
                        label=""
                        placeholder="Tag/Monat/Jahr"
                        displayFormat="dd.MM.yyyy"
                        minDate={new Date(2020, 0, 1)}
                        maxDate={new Date(2030, 11, 31)}
                    />
                </div>

            </div>

            <p className="text-xs text-gray-500">
                {autoStatus === "planned"
                    ? "Automatisch als geplant erkannt"
                    : "Wird sofort verbucht"}
            </p>
        </div>
    );
}