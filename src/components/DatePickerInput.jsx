import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format as fmt, parse } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarPlus2 } from 'lucide-react';
// import Kalender from "../assets/Kalender.svg?react";

import { txDraft } from "../store/transactionDraft";


function classNames(...xs) { return xs.filter(Boolean).join(" "); }

export default function DatePickerInput({
  value,                 // Date | null
  onChange,              // (Date|null)=>void
  label,
  placeholder = "MM/DD/YYYY",
  displayFormat = "dd.MM.yyyy",
  locale = de,           // DE local for Calender
  minDate,               // Date | undefined
  maxDate,               // Date | undefined
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value ? fmt(value, displayFormat) : "");
  const ref = useRef(null);

  // close with click
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);

    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Sinchronization value -> text
  useEffect(() => {
    if (value) setText(fmt(value, displayFormat));
    else setText("");
  }, [value, displayFormat]);

  // parsing hand input
  function commitText(t) {
    setText(t);
    const d = parse(t, displayFormat, new Date());
    if (!isNaN(d)) {
      if (minDate && d < minDate) return;
      if (maxDate && d > maxDate) return;
      onChange?.(d);
    } else {
      onChange?.(null);
    }
  }

  const footer = useMemo(() => {
    if (!value) return <p className="text-xs text-gray-500 px-2 pb-2">Wähle ein Datum</p>;
    return <p className="text-xs text-gray-600 px-2 pb-2">Ausgewählt: {fmt(value, displayFormat)}</p>;
  }, [value, displayFormat]);

  return (
    <div className="w-full" ref={ref}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-800">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={classNames(
            "h-12 w-full border shadow-sm border-gray-400 px-4 pr-11",
            "text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400",
          )}
          value={text}
          onChange={(e) => commitText(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          inputMode="numeric"
          aria-required={required}
        />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-600"
          aria-label="Kalender öffnen"
        >
          {/* Icon calend */}
          <CalendarPlus2 className="w-5 h-5" />
        </button>

        {open && (
          <div className="absolute z-20 mt-2 w-[320px] border border-gray-400 bg-white shadow-sm">
            <DayPicker
              mode="single"
              selected={value ?? undefined}
              onSelect={(d) => { onChange?.(d ?? null); setOpen(false); }}
              locale={locale}
              weekStartsOn={1}
              fromDate={minDate}
              toDate={maxDate}
              captionLayout="buttons"
              className="p-2"
              modifiersClassNames={{
                selected: "!bg-blue-400 !text-white !rounded-full hover:!bg-blue-400",
                today: "!border-blue-400 !rounded-full !bg-blue-100",
              }}
            />
            <RepeatPanel
              initial={{
                enabled: txDraft.getField("repeat") ?? false,
                freq: txDraft.getField("repeat_freq") ?? "WEEKLY",    // DAILY | WEEKLY | MONTHLY | YEARLY
                interval: txDraft.getField("repeat_interval") ?? 1,   // Evry N
                byweekday: txDraft.getField("repeat_byweekday") ?? [],// [1,2,3] (Mon=1..Son=7)
                until: txDraft.getField("repeat_until") ? new Date(txDraft.getField("repeat_until")) : null,
              }}
              anchorDate={value ?? null}
              onChange={(r) => {
                // Save
                try {
                  txDraft.set("repeat", r.enabled);
                  txDraft.set("repeat_freq", r.freq);
                  txDraft.set("repeat_interval", r.interval);
                  txDraft.set("repeat_byweekday", r.byweekday);
                  txDraft.set("repeat_until", r.until ? r.until.toISOString() : "");
                } catch { }
              }}
            />
            {footer}
            <div className="sticky bottom-0 flex justify-end gap-2 border bg-white px-3 py-2">
              <button className="px-3 py-1 text-sm hover:bg-gray-100"
                onClick={() => setOpen(false)}>Cancel</button>
              <button className="bg-blue-400 px-3 py-1 text-sm text-white hover:bg-blue-400"
                onClick={() => setOpen(false)}>OK</button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">{placeholder}</p>
    </div>
  );
}


function RepeatPanel({ initial, onChange, anchorDate }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [freq, setFreq] = useState(initial.freq);
  const [interval, setInterval] = useState(initial.interval);
  const [byweekday, setByweekday] = useState(initial.byweekday);
  const [until, setUntil] = useState(initial.until);

  useEffect(() => {
    onChange?.({ enabled, freq, interval, byweekday, until });
  }, [enabled, freq, interval, byweekday, until]);

  function toggleWd(n) {
    setByweekday((arr) => arr.includes(n) ? arr.filter(x => x !== n) : [...arr, n].sort());
  }

  // Preview
  const preview = useMemo(() => {
    if (!enabled || !anchorDate) return "";
    const d = new Date(anchorDate);
    const copy = new Date(d);
    if (freq === "DAILY") copy.setDate(copy.getDate() + interval);
    if (freq === "WEEKLY") copy.setDate(copy.getDate() + 7 * interval);
    if (freq === "MONTHLY") copy.setMonth(copy.getMonth() + interval);
    if (freq === "YEARLY") copy.setFullYear(copy.getFullYear() + interval);
    return `Nächstes: ${copy.toLocaleDateString("de-DE")}`;
  }, [enabled, anchorDate, freq, interval]);

  const WDS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]; // 1..7

  return (
    <div className="border-t p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Wiederholen</span>
        <button
          type="button"
          onClick={() => setEnabled(v => !v)}
          className={`h-6 w-11 rounded-full transition ${enabled ? "bg-blue-400" : "bg-gray-300"}`}
        >
          <span className={`block h-6 w-6 rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">Frequenz</span>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
              >
                <option value="DAILY">Täglich</option>
                <option value="WEEKLY">Wöchentlich</option>
                <option value="MONTHLY">Monatlich</option>
                <option value="YEARLY">Jährlich</option>

              </select>
            </label>
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">Intervall</span>
              <input
                type="number" min={1}
                className="w-full rounded-lg border px-3 py-2"
                value={interval}
                onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
          </div>

          {freq === "WEEKLY" && (
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Wochentage</div>
              <div className="grid grid-cols-7 gap-1">
                {WDS.map((label, idx) => {
                  const n = idx + 1; // Mo=1..So=7
                  const on = byweekday.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleWd(n)}
                      className={`rounded-md px-2 py-1 text-sm border ${on ? "bg-blue-400 text-white border-blue-400" : "bg-white hover:bg-gray-50"
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="text-sm block">
            <span className="block text-gray-600 mb-1">Ende (optional)</span>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2"
              value={until ? new Date(until).toISOString().slice(0, 10) : ""}
              onChange={(e) => setUntil(e.target.value ? new Date(e.target.value + "T00:00:00") : null)}
            />
          </label>

          {!!preview && <div className="text-xs text-gray-500">{preview}</div>}
        </div>
      )}
    </div>
  );
}