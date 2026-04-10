import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format as fmt, parse } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarPlus2 } from 'lucide-react';

import { txDraft } from "../store/transactionDraft";

function toLocalDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function classNames(...xs) { return xs.filter(Boolean).join(" "); }

function getRepeatFromDraft() {
  return {
    enabled: txDraft.getField("repeat") ?? false,
    freq: txDraft.getField("repeat_freq") ?? "WEEKLY",
    interval: txDraft.getField("repeat_interval") ?? 1,
    byweekday: txDraft.getField("repeat_byweekday") ?? [],
    until: txDraft.getField("repeat_until") ? new Date(txDraft.getField("repeat_until")) : null,
  };
}

export default function DatePickerInput({
  value,
  onChange,
  label,
  placeholder = "MM/DD/YYYY",
  displayFormat = "dd.MM.yyyy",
  locale = de,
  minDate,
  maxDate,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value ? fmt(value, displayFormat) : "");
  const ref = useRef(null);
  const [repeatDraft, setRepeatDraft] = useState(null);

  function handleOpen() {
    setRepeatDraft(getRepeatFromDraft());
    setOpen(true);
  }

  function handleConfirm() {
    if (repeatDraft) {
      try {
        txDraft.set("repeat", repeatDraft.enabled);
        txDraft.set("repeat_freq", repeatDraft.freq);
        txDraft.set("repeat_interval", repeatDraft.interval);
        txDraft.set("repeat_byweekday", repeatDraft.byweekday);
        txDraft.set("repeat_until", repeatDraft.until ? toLocalDateOnly(repeatDraft.until) : "");
      } catch (err) {
        console.error("RepeatPanel confirm failed:", err);
      }
    }
    setOpen(false);
  }

  function handleCancel() {
    setRepeatDraft(null);
    setOpen(false);
  }


  const handleCancelRef = useRef(handleCancel);
  useEffect(() => { handleCancelRef.current = handleCancel; });

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) handleCancelRef.current();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (value) setText(fmt(value, displayFormat));
    else setText("");
  }, [value, displayFormat]);

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
          onFocus={handleOpen}
          placeholder={placeholder}
          inputMode="numeric"
          aria-required={required}
        />
        <button
          type="button"
          onClick={() => open ? handleCancel() : handleOpen()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-600"
          aria-label="Kalender öffnen"
        >
          <CalendarPlus2 className="w-5 h-5" />
        </button>

        {open && repeatDraft && (
          <div className="absolute z-20 mt-2 w-[320px] border border-gray-400 bg-white shadow-sm">
            <DayPicker
              mode="single"
              selected={value ?? undefined}
              onSelect={(d) => { onChange?.(d ?? null); }}
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
              initial={repeatDraft}
              onChange={setRepeatDraft}
              anchorDate={value ?? null}
            />
            {footer}
            <div className="sticky bottom-0 flex justify-end gap-2 border bg-white px-3 py-2">
              <button
                className="px-3 py-1 text-sm hover:bg-gray-100"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="bg-blue-400 px-3 py-1 text-sm text-white hover:bg-blue-400"
                onClick={handleConfirm}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function RepeatPanel({ initial, onChange, anchorDate }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [freq, setFreq] = useState(initial.freq);
  const [interval, setInterval] = useState(initial.interval);
  const [byweekday, setByweekday] = useState(initial.byweekday);
  const [until, setUntil] = useState(initial.until);


  function notify(patch) {
    onChange?.({ enabled, freq, interval, byweekday, until, ...patch });
  }

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    notify({ enabled: next });
  }

  function handleFreq(val) {
    setFreq(val);
    notify({ freq: val });
  }

  function handleInterval(val) {
    const next = Math.max(1, Number(val) || 1);
    setInterval(next);
    notify({ interval: next });
  }

  function handleUntil(val) {
    const next = val ? new Date(val + "T00:00:00") : null;
    setUntil(next);
    notify({ until: next });
  }

  function toggleWd(n) {
    const next = byweekday.includes(n)
      ? byweekday.filter(x => x !== n)
      : [...byweekday, n].sort();
    setByweekday(next);
    notify({ byweekday: next });
  }

  const preview = useMemo(() => {
    if (!enabled || !anchorDate) return "";
    const copy = new Date(anchorDate);
    if (freq === "DAILY") copy.setDate(copy.getDate() + interval);
    if (freq === "WEEKLY") copy.setDate(copy.getDate() + 7 * interval);
    if (freq === "MONTHLY") copy.setMonth(copy.getMonth() + interval);
    if (freq === "YEARLY") copy.setFullYear(copy.getFullYear() + interval);
    return `Nächstes: ${copy.toLocaleDateString("de-DE")}`;
  }, [enabled, anchorDate, freq, interval]);

  const WDS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  return (
    <div className="border-t p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Wiederholen</span>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-blue-400" : "bg-gray-300"}`}
        >
          <span
            className={`absolute top-0 left-0 block h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
          />
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
                onChange={(e) => handleFreq(e.target.value)}
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
                type="number"
                min={1}
                className="w-full rounded-lg border px-3 py-2"
                value={interval}
                onChange={(e) => handleInterval(e.target.value)}
              />
            </label>
          </div>

          {freq === "WEEKLY" && (
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Wochentage</div>
              <div className="grid grid-cols-7 gap-1">
                {WDS.map((label, idx) => {
                  const n = idx + 1;
                  const on = byweekday.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleWd(n)}
                      className={`rounded-md px-2 py-1 text-sm border ${on ? "bg-blue-400 text-white border-blue-400" : "bg-white hover:bg-gray-50"}`}
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
              value={until ? toLocalDateOnly(new Date(until)) : ""}
              onChange={(e) => handleUntil(e.target.value)}
            />
          </label>

          {!!preview && <div className="text-xs text-gray-500">{preview}</div>}
        </div>
      )}
    </div>
  );
}
