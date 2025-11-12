import React, { useEffect, useRef, useMemo, useState, forwardRef } from "react";
import type { ComboboxProps, ComboOption } from "./types";
// import { OptionItem } from "./OptionItem";
import { Edit3 } from "lucide-react";
import { IconRenderer } from "../../IconRenderer";
export const Combobox = forwardRef(function Combobox<T extends ComboOption>(
    props: ComboboxProps<T>,
    _ignored: React.Ref<HTMLDivElement>
) {
    const {
        label,
        placeholder = "Bitte wählen…",
        options,
        value,
        onChange,
        disabled = false,
        required = false,
        helperText,
        allowCreate = false,
        onCreate,
        allowEdit = false,
        onEdit,
        onDelete,
        inputRef,
    } = props;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const rootRef = useRef<HTMLDivElement | null>(null);
    const innerInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const onDocDown = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocDown);
        return () => document.removeEventListener("mousedown", onDocDown);
    }, [open]);

    const selected = options.find(o => o.id === value) || null;

    // Pure + memoized filter to avoid render storms
    const list = useMemo(() => {
        const base = options || [];
        if (!query.trim()) return base;
        const q = query.trim().toLowerCase();
        return base.filter((o) => o.name.toLowerCase().includes(q));
    }, [options, query]);


    const filtered = query
        ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()))
        : options;

    return (
        <div className="mb-6" ref={rootRef}>
            <label className="block text-center text-black text-base font-medium mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {helperText && <span className="text-xs text-gray-500">{helperText}</span>}

            <div className="relative">
                <input
                    ref={innerInputRef}
                    type="text"
                    disabled={disabled}
                    placeholder={selected ? selected.name : placeholder}
                    value={open ? query : selected ? selected.name : ""}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}


                    onFocus={() => setOpen(true)}
                    className={`h-12 w-full border shadow-sm border-gray-500/80 px-3 outline-none placeholder-gray-400
            focus:border-blue-400 focus:ring-1 focus:ring-blue-400
            ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={`${label}-listbox`}
                    aria-autocomplete="list"
                />

                {open && query && (
                    <button
                        type="button"
                        aria-label="Eingabe löschen"
                        onClick={() => setQuery("")}
                        className="absolute inset-y-0 right-2 flex items-center rounded p-1 text-gray-500 hover:bg-gray-100"
                    >
                        ✕
                    </button>
                )}
            </div>

            {open && !disabled && (
                <div className="relative z-20" role="listbox" id={`${label}-listbox`} aria-label={`${label} Liste`}>
                    <ul className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow">
                        {list.map((o) => (
                            <li key={o.id} className="group">
                                <div className="flex w-full items-center justify-between rounded-md px-2 py-1">
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
                                        onClick={() => {
                                            onChange?.(o.id, o);
                                            setOpen(false);
                                            setQuery("");
                                            // Return focus to input to keep flow fast
                                            innerInputRef.current?.focus();
                                        }}
                                        className={`text-left w-full pr-10 transition rounded-md px-2 py-2 hover:bg-gray-50 ${value === o.id ? "ring-1 ring-blue-400 bg-blue-50" : ""
                                            }`}
                                        role="option"
                                        aria-selected={value === o.id}
                                    >
                                        <div className="flex items-center gap-2">
                                            {"icon" in o && (o as any).icon ? <IconRenderer icon={(o as any).icon} /> : null}
                                            <span>{o.name}</span>
                                        </div>
                                    </button>

                                    {allowEdit && (
                                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition flex gap-2">
                                            <button
                                                type="button"
                                                className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                                onClick={() => {
                                                    const newName = prompt("Neuer Name:", o.name);
                                                    if (newName && newName.trim()) onEdit?.(o.id, newName.trim());
                                                }}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs text-red-600 hover:underline"
                                                onClick={() => {
                                                    if (confirm(`„${o.name}“ wirklich löschen?`)) onDelete?.(o.id);
                                                }}
                                            >
                                                Löschen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}

                        {allowCreate && (
                            <li className="mt-1 border-t border-gray-200 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const name = prompt("Neuen Eintrag hinzufügen:");
                                        if (name && name.trim()) onCreate?.(name.trim());
                                        setOpen(false);
                                        setQuery("");
                                        innerInputRef.current?.focus();
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-gray-50 transition"
                                >
                                    <span>＋</span>
                                    <span>Neu hinzufügen</span>
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}) as <T extends ComboOption>(p: ComboboxProps<T>) => React.ReactElement;