// GuestTransactionStep3.tsx
// Thin page: dictionaries come from stores (useDicts + useIncomeDicts) with persist.
// The page only reads/writes via store actions. All comments in English (best practices).
import * as Lucide from "lucide-react";

import PageHeader from "../components/PageHeader.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useRef, useEffect, useState } from "react";
import Button from "../components/Button";
import Progress from "../components/Progress";

import { Edit3, MoveLeft, Settings as SettingsIcon, CircleHelp } from "lucide-react";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";
import { useDicts } from "../store/dicts";
import { useIncomeDicts } from "../store/incomeDicts";

// ---------- Icon types & renderer ----------
type IconSpec = { kind: "lucide" | "emoji"; value: string; color?: string };

// If you use your own SVG catalog, replace this mapping with your own.
function IconRenderer({
    icon,
    className = "w-4 h-4",
    title,
}: {
    icon?: IconSpec;
    className?: string;
    title?: string;
}) {
    if (!icon) return null;

    if (icon.kind === "emoji") {
        return (
            <span className={className} aria-label={title ?? "icon"} title={title}>
                {icon.value}
            </span>
        );
    }

    // Lucide dynamic resolve by name (fallback to CircleHelp)
    const Name = (icon.value?.trim() || "CircleHelp") as keyof typeof import("lucide-react");
    const Map = { CircleHelp };
    const Comp =
        (Lucide as any)[Name] ?? Lucide.CircleHelp;

    return <Comp className={className} aria-label={title ?? "icon"} title={title} />;
}

// ---------- Generic Combobox (stateless, a11y-friendly) ----------
function Combobox<T extends { id: string; name: string; icon?: IconSpec }>({
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
}: {
    label: string;
    placeholder?: string;
    options: T[];
    value: string;
    onChange?: (id: string, option?: T) => void;
    disabled?: boolean;
    required?: boolean;
    helperText?: string;
    allowCreate?: boolean;
    onCreate?: (name: string) => void;
    allowEdit?: boolean;
    onEdit?: (id: string, newName: string) => void;
    onDelete?: (id: string) => void;
}) {
    // Lightweight controlled popover with outside-click close
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const selected = (options || []).find((o) => o.id === value) || null;
    const list = useMemo(() => {
        const base = options || [];
        if (!query.trim()) return base;
        const q = query.trim().toLowerCase();
        return base.filter((o) => o.name.toLowerCase().includes(q));
    }, [options, query]);

    return (
        <div className="mb-6" ref={ref}>
            <label className="block text-center text-black text-base font-medium mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {helperText && <span className="text-xs text-gray-500">{helperText}</span>}

            <div className="relative">
                <input
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
                                        onClick={() => {
                                            onChange?.(o.id, o);
                                            setOpen(false);
                                            setQuery("");
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
}

// ---------- Page (thin) ----------
export default function GuestTransactionStep3() {
    const navigate = useNavigate();

    // Transaction draft is a separate concern — we only set selected ids/names here.
    const {
        kind = null,
        gruppeId = "",
        anbieterId = "",
        kategorieId = "",
        incomeType = "",
        quelleId = "",
        quelleName = "",
        remark = "",
    } = useTxDraft();

    // Expense dictionaries (Zustand + persist)
    const {
        gruppen,
        kategorien,
        getAnbieterByGroup,
        createGroup,
        renameGroup,
        deleteGroup,
        createProvider,
        renameProvider,
        deleteProvider,
        createCategory,
        renameCategory,
        deleteCategory,
    } = useDicts();

    // Income dictionaries (Zustand + persist)
    const {
        incomeTypes,
        sources,
        createType,
        renameType,
        deleteType,
        createSource,
        renameSource,
        deleteSource,
    } = useIncomeDicts();

    // Derived lists (computed, no local copies)
    const anbieterOptions = useMemo(() => getAnbieterByGroup(gruppeId), [getAnbieterByGroup, gruppeId]);
    const kategorieOptions = useMemo(() => (gruppeId ? kategorien[gruppeId] || [] : []), [kategorien, gruppeId]);

    // Reset dependent picks when group changes (avoid stale ids)
    useEffect(() => {
        if (kind === "expense") {
            txDraft.setMany({ anbieterId: "", kategorieId: "" });
        }
    }, [gruppeId, kind]);

    const requireCategory = true;
    const canProceed =
        kind === "income"
            ? Boolean(incomeType && (quelleId || quelleName))
            : kind === "expense"
                ? Boolean(gruppeId && (requireCategory ? kategorieId : true))
                : false;

    function next() {
        navigate("/TestErgebniss");
    }

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link to="/guestTransactionStep2" className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800">
                            <MoveLeft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={<Progress step={3} total={4} className="hidden sm:flex w-[120px]" srLabel="Schrittfortschritt" />}
                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group p-2 hover:bg-gray-100 transition rounded-lg inline-flex items-center justify-center"
                            type="button"
                        >
                            <SettingsIcon className="h-6 w-6 text-gray-600 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />

                <section className="flex-1">
                    <h1 className="text-lg text-gray-600 mb-4">Demo-Zugang (Dictionaries via Store)</h1>

                    {/* -------- Income branch -------- */}
                    {kind === "income" && (
                        <>
                            <Combobox
                                label="Typ (Einnahme)"
                                required
                                options={incomeTypes}
                                value={incomeType}
                                onChange={(id) => txDraft.set("incomeType", id)}
                                placeholder="Typ wählen…"
                                allowCreate
                                onCreate={(name) => {
                                    const id = createType(name);
                                    txDraft.set("incomeType", id);
                                }}
                                allowEdit
                                onEdit={(id, newName) => renameType(id, newName)}
                                onDelete={(id) => {
                                    deleteType(id);
                                    if (incomeType === id) txDraft.set("incomeType", "");
                                }}
                            />

                            <Combobox
                                label="Quelle"
                                required
                                options={sources}
                                value={quelleId || ""}
                                onChange={(id, opt) => txDraft.setMany({ quelleId: id, quelleName: opt?.name ?? "" })}
                                placeholder="z. B. Arbeitgeber"
                                allowCreate
                                onCreate={(name) => {
                                    const id = createSource(name);
                                    txDraft.setMany({ quelleId: id, quelleName: name });
                                }}
                                allowEdit
                                onEdit={(id, newName) => renameSource(id, newName)}
                                onDelete={(id) => {
                                    deleteSource(id);
                                    if (quelleId === id) txDraft.setMany({ quelleId: "", quelleName: "" });
                                }}
                            />
                        </>
                    )}

                    {/* -------- Expense branch -------- */}
                    {kind === "expense" && (
                        <>
                            {/* Group */}
                            <Combobox
                                label="Gruppe"
                                required
                                options={gruppen}
                                value={gruppeId}
                                onChange={(id) => txDraft.set("gruppeId", id)}
                                placeholder="Gruppe wählen…"
                                allowCreate
                                onCreate={(name) => {
                                    const id = createGroup(name);
                                    txDraft.set("gruppeId", id);
                                }}
                                allowEdit
                                onEdit={(id, newName) => renameGroup(id, newName)}
                                onDelete={(id) => {
                                    deleteGroup(id);
                                    if (gruppeId === id) txDraft.setMany({ gruppeId: "", anbieterId: "", kategorieId: "" });
                                }}
                            />

                            {/* Provider (filtered by selected group) */}
                            <Combobox
                                label="Anbieter"
                                helperText={gruppeId ? "gefiltert nach Gruppe" : "zuerst Gruppe wählen"}
                                options={anbieterOptions}
                                value={anbieterId}
                                onChange={(id) => txDraft.set("anbieterId", id)}
                                placeholder="z. B. Rewe"
                                allowCreate
                                onCreate={(name) => {
                                    if (!gruppeId) return alert("Zuerst Gruppe wählen.");
                                    const id = createProvider(name, gruppeId);
                                    txDraft.set("anbieterId", id);
                                }}
                                allowEdit
                                onEdit={(id, newName) => renameProvider(id, newName)}
                                onDelete={(id) => {
                                    deleteProvider(id);
                                    if (anbieterId === id) txDraft.set("anbieterId", "");
                                }}
                            />

                            {/* Category (required) */}
                            <Combobox
                                label="Kategorie"
                                required={true}
                                options={kategorieOptions}
                                value={kategorieId}
                                onChange={(id) => txDraft.set("kategorieId", id)}
                                placeholder={gruppeId ? "Kategorie wählen…" : "Erst Gruppe wählen"}
                                disabled={!gruppeId}
                                allowCreate
                                onCreate={(name) => {
                                    if (!gruppeId) return alert("Zuerst Gruppe wählen.");
                                    const id = createCategory(gruppeId, name);
                                    txDraft.set("kategorieId", id);
                                }}
                                allowEdit
                                onEdit={(id, newName) => {
                                    if (!gruppeId) return;
                                    renameCategory(gruppeId, id, newName);
                                }}
                                onDelete={(id) => {
                                    if (!gruppeId) return;
                                    deleteCategory(gruppeId, id);
                                    if (kategorieId === id) txDraft.set("kategorieId", "");
                                }}
                            />
                        </>
                    )}

                    {/* Remark */}
                    <div className="mt-6">
                        <div className="flex justify-center items-center text-black text-base gap-2 font-medium mb-1">
                            <span>Bemerkung</span>
                            <Edit3 className="w-4 h-4" />
                        </div>

                        <div className="relative">
                            <textarea
                                value={remark}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v.length <= 100) txDraft.set("remark", v);
                                }}
                                placeholder="Optionale Notiz (z. B. 'Aktion', 'für Schule' …)"
                                className="w-full h-24 border pl-3 pr-3 py-2 shadow-sm
                  focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                  resize-none outline-none placeholder-gray-400"
                                maxLength={100}
                            />
                            <span className="absolute bottom-1 right-3 text-xs text-gray-500">{remark.length}/100</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Button variant="primary" onClick={next} disabled={!canProceed}>
                            Weiter
                        </Button>
                    </div>
                </section>
                {/* Developer Panel */}
                <div className="mt-10 border-t border-gray-300 pt-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => {
                                localStorage.removeItem("ft_dicts_v2");
                                localStorage.removeItem("ft_income_dicts_v1");
                                location.reload();
                            }}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                        >
                            🧹 Reset Dictionaries
                        </button>

                        <button
                            onClick={() => {
                                console.log("Gruppen:", useDicts.getState().gruppen);
                                console.log("Kategorien:", useDicts.getState().kategorien);
                                console.log("Anbieter:", useDicts.getState().anbieter);
                                console.log("Income Types:", useIncomeDicts.getState().incomeTypes);
                                console.log("Sources:", useIncomeDicts.getState().sources);
                                alert("✅ Data printed in console");
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                        >
                            💾 Show Data (Console)
                        </button>
                    </div>

                    <div className="mt-3 text-gray-500">
                        <p>Gruppen: {useDicts.getState().gruppen.length}</p>
                        <p>Anbieter: {useDicts.getState().anbieter.length}</p>
                        <p>Kategorien: {Object.keys(useDicts.getState().kategorien).length}</p>
                        <p>Income Types: {useIncomeDicts.getState().incomeTypes.length}</p>
                        <p>Sources: {useIncomeDicts.getState().sources.length}</p>
                    </div>
                </div>



            </main>
        </div>
    );
}
