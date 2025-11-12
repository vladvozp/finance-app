// GuestTransactionStep3.tsx
// Smart UI, dumb data. Provider → Category → Group (auto) with manual override.
// Comments are in English (best practices).

import { Link, useNavigate } from "react-router-dom";
import { useMemo, useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";

import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";
import Progress from "../components/Progress";

import { Edit3, MoveLeft, Settings } from "lucide-react";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";
import { useDicts } from "../store/dicts";
import { useIncomeDicts } from "../store/incomeDicts";

import { Combobox, type ComboOption } from "../components/ui/combobox";

type Provider = ComboOption & {};
type Category = ComboOption & {};
type Group = ComboOption & {};
type Type = ComboOption & {};
type Source = ComboOption & {};

// import { IconRenderer, type IconSpec } from "../components/IconRenderer";


// ---------- Generic Combobox (stateless UI; exposes inputRef for focus) ----------
{/* type ComboOption = { id: string; name: string; icon?: IconSpec };

type ComboboxProps<T extends ComboOption> = {
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
    inputRef?: React.Ref<HTMLInputElement>; // NEW: allow parent to focus input
};

const Combobox = forwardRef(function Combobox<T extends ComboOption>(
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

    // Expose input element to parent via inputRef
    useEffect(() => {
        if (!inputRef) return;
        if (typeof inputRef === "function") inputRef(innerInputRef.current!);
        else if ("current" in (inputRef as any)) (inputRef as any).current = innerInputRef.current;
    }, [inputRef]);

    // Close on outside click (single listener)
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const selected = (options || []).find((o) => o.id === value) || null;

    // Pure + memoized filter to avoid render storms
    const list = useMemo(() => {
        const base = options || [];
        if (!query.trim()) return base;
        const q = query.trim().toLowerCase();
        return base.filter((o) => o.name.toLowerCase().includes(q));
    }, [options, query]);

   {/* return (
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
}) as <T extends ComboOption>(p: ComboboxProps<T>) => React.ReactElement; */}

// ---------- Helpers (provider → category; category ↔ group) ----------
function getCategoriesForSupplier(
    supplierId: string,
    anbieter: Array<{ id: string; name: string; gruppen: string[] }>,
    kategorien: Record<string, Array<{ id: string; name: string }>>
) {
    if (!supplierId) return [] as Array<{ id: string; name: string; groupId?: string }>;
    const supplier = anbieter.find((a) => a.id === supplierId);
    if (!supplier) return [];
    const groups = supplier.gruppen || [];
    const flatten: Array<{ id: string; name: string; groupId?: string }> = [];
    for (const gId of groups) {
        const list = kategorien[gId] || [];
        for (const c of list) flatten.push({ ...c, groupId: gId });
    }
    const seen = new Set<string>();
    return flatten.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

function findGroupIdByCategoryId(
    categoryId: string,
    kategorien: Record<string, Array<{ id: string; name: string }>>
): string | "" {
    if (!categoryId) return "";
    for (const [gId, list] of Object.entries(kategorien)) {
        if (list.some((c) => c.id === categoryId)) return gId;
    }
    return "";
}

function suggestCategoryIdForSupplier(
    supplierId: string,
    anbieter: Array<{ id: string; name: string; gruppen: string[] }>,
    kategorien: Record<string, Array<{ id: string; name: string }>>
): string {
    const pool = getCategoriesForSupplier(supplierId, anbieter, kategorien);
    if (pool.length === 1) return pool[0].id;
    return "";
}

// ---------- Page ----------
export default function GuestTransactionStep3() {
    const navigate = useNavigate();

    // Draft slice (now includes gruppeMode persisted in store)
    const {
        kind = null,
        gruppeId = "",
        anbieterId = "",
        kategorieId = "",
        incomeType = "",
        quelleId = "",
        quelleName = "",
        remark = "",
        gruppeMode = "auto", // <-- persist this in your txDraft store defaults
    } = useTxDraft() as any;

    // Dicts
    const {
        gruppen,
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
    const { incomeTypes, sources, createType, renameType, deleteType, createSource, renameSource, deleteSource } =
        useIncomeDicts();

    const anbieter = useDicts((s) => s.anbieter);
    const kategorien = useDicts((s) => s.kategorien);

    // Derived group by category (auto mode)
    const derivedGroupId = useMemo(() => findGroupIdByCategoryId(kategorieId, kategorien), [kategorieId, kategorien]);

    // Effective group id depends on mode
    const effectiveGroupId = gruppeMode === "manual" ? gruppeId : derivedGroupId;

    // Keep store.groupId in sync with effectiveGroupId (guarded)
    useEffect(() => {
        const target = effectiveGroupId || "";
        if (target !== gruppeId) txDraft.set("gruppeId", target);
    }, [effectiveGroupId, gruppeId]);

    // Provider options
    const providerOptions = anbieter;

    // Category options:
    // - manual mode: restrict strictly to the selected group
    // - auto mode: union of supplier's groups
    const categoryOptions = useMemo(() => {
        if (gruppeMode === "manual") {
            if (!effectiveGroupId) return [];
            return (kategorien[effectiveGroupId] || []).map((c) => ({ ...c, groupId: effectiveGroupId }));
        }
        return getCategoriesForSupplier(anbieterId, anbieter, kategorien);
    }, [gruppeMode, effectiveGroupId, anbieterId, anbieter, kategorien]);

    // Smart suggestion (used for the hint under provider)
    const suggestedCategoryId = useMemo(
        () => (gruppeMode === "auto" ? suggestCategoryIdForSupplier(anbieterId, anbieter, kategorien) : ""),
        [gruppeMode, anbieterId, anbieter, kategorien]
    );

    // Refs
    const categoryInputRef = useRef<HTMLInputElement | null>(null);

    // Handlers
    const onProviderChange = useCallback(
        (id: string) => {
            txDraft.setMany({ anbieterId: id });

            if (gruppeMode === "manual") {
                // Manual: keep group as is; ensure category fits selected group
                if (kategorieId) {
                    const ok = (kategorien[effectiveGroupId || ""] || []).some((c) => c.id === kategorieId);
                    if (!ok) txDraft.set("kategorieId", "");
                }
            } else {
                // Auto: union; clear incompatible category, apply suggestion if unambiguous
                if (kategorieId) {
                    const belongs = getCategoriesForSupplier(id, anbieter, kategorien).some((c) => c.id === kategorieId);
                    if (!belongs) txDraft.set("kategorieId", "");
                }
                const suggestion = suggestCategoryIdForSupplier(id, anbieter, kategorien);
                if (suggestion && suggestion !== kategorieId) txDraft.set("kategorieId", suggestion);
            }
        },
        [gruppeMode, kategorieId, anbieter, kategorien, effectiveGroupId]
    );

    const onCategoryChange = useCallback(
        (id: string) => {
            txDraft.set("kategorieId", id);
            if (gruppeMode === "auto") {
                const g = findGroupIdByCategoryId(id, kategorien);
                if (g && g !== gruppeId) txDraft.set("gruppeId", g);
            }
        },
        [gruppeMode, kategorien, gruppeId]
    );

    const onGroupChangeManual = useCallback((id: string) => {
        txDraft.setMany({ gruppeId: id, kategorieId: "" });
    }, []);

    const applySuggestedCategory = useCallback(() => {
        if (!suggestedCategoryId) return;
        txDraft.set("kategorieId", suggestedCategoryId);
        // Focus category field after applying suggestion (quick correction flow)
        categoryInputRef.current?.focus();
    }, [suggestedCategoryId]);

    const toggleGroupMode = useCallback(() => {
        const next = gruppeMode === "auto" ? "manual" : "auto";
        txDraft.set("gruppeMode", next); // persist in draft
        if (next === "manual") {
            // Entering manual: keep existing gruppeId; ensure category consistency
            if (kategorieId) {
                const ok = (kategorien[(gruppeId || "")] || []).some((c) => c.id === kategorieId);
                if (!ok) txDraft.set("kategorieId", "");
            }
        } else {
            // Back to auto: ensure gruppeId follows category
            const g = findGroupIdByCategoryId(kategorieId, kategorien) || "";
            txDraft.set("gruppeId", g);
        }
    }, [gruppeMode, kategorieId, gruppeId, kategorien]);

    // Proceed rules
    const canProceed =
        kind === "income"
            ? Boolean(incomeType && (quelleId || quelleName))
            : kind === "expense"
                ? Boolean(kategorieId)
                : false;

    function next() {
        navigate("/TestErgebniss");
    }

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guestTransactionStep2"
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <MoveLeft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={<Progress step={3} total={4} className="hidden sm:flex w-[120px]" srLabel="Schrittfortschritt" />}
                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group p-2 transition rounded-lg inline-flex items-center justify-center"
                            type="button"
                        >
                            <Settings className="h-5 w-5 text-gray-600 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />

                <section className="flex-1">
                    <h1 className="text-lg text-gray-600 mb-4">Demo-Zugang (Dictionaries via Store)</h1>

                    {/* -------- Income branch -------- */}
                    {kind === "income" && (
                        <>
                            <Combobox<Type>
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

                            <Combobox<Source>
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
                            {/* 1) Provider */}
                            <Combobox<Provider>
                                label="Anbieter"
                                helperText="erste Auswahl – Kategorien werden automatisch vorgeschlagen"
                                options={anbieter}
                                value={anbieterId}
                                onChange={(id) => onProviderChange(id)}
                                placeholder="z. B. Rewe"
                                allowCreate
                                onCreate={(name) => {
                                    const id = createProvider(name, "");
                                    txDraft.set("anbieterId", id);
                                }}
                                allowEdit
                                onEdit={(id, newName) => renameProvider(id, newName)}
                                onDelete={(id) => {
                                    deleteProvider(id);
                                    if (anbieterId === id) txDraft.set("anbieterId", "");
                                }}
                            />

                            {/* Smart hint under provider */}
                            {anbieterId && (suggestedCategoryId || kategorieId) && (
                                <div className="mt-[-12px] mb-4 text-center">
                                    <span className="text-xs text-gray-500">
                                        {kategorieId
                                            ? (() => {
                                                const catName = getCategoriesForSupplier(anbieterId, anbieter, kategorien).find(
                                                    (c) => c.id === kategorieId
                                                )?.name ?? "Kategorie";
                                                const grpName = gruppen.find((g) => g.id === effectiveGroupId)?.name ?? "Gruppe";
                                                return `Aktuell kategorisiert als ${catName} / ${grpName}`;
                                            })()
                                            : (() => {
                                                const catName =
                                                    getCategoriesForSupplier(anbieterId, anbieter, kategorien).find(
                                                        (c) => c.id === suggestedCategoryId
                                                    )?.name ?? "Kategorie";
                                                const grpId = findGroupIdByCategoryId(suggestedCategoryId, kategorien);
                                                const grpName = gruppen.find((g) => g.id === grpId)?.name ?? "Gruppe";
                                                return `Automatisch vorgeschlagen: ${catName} / ${grpName}`;
                                            })()}
                                    </span>

                                    <div className="mt-1 flex gap-3 justify-center">
                                        {!kategorieId && suggestedCategoryId && (
                                            <button
                                                type="button"
                                                onClick={applySuggestedCategory}
                                                className="text-xs text-blue-600 underline hover:text-blue-800"
                                            >
                                                übernehmen
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => categoryInputRef.current?.focus()}
                                            className="text-xs text-gray-600 underline hover:text-gray-800"
                                        >
                                            ändern
                                        </button>
                                        <button
                                            type="button"
                                            onClick={toggleGroupMode}
                                            className="text-xs text-gray-600 underline hover:text-gray-800"
                                        >
                                            {gruppeMode === "auto" ? "Gruppe manuell wählen" : "Gruppe automatisch"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 2) Category */}
                            <Combobox<Category>
                                label="Kategorie"
                                required
                                options={categoryOptions}
                                value={kategorieId}
                                onChange={(id) => onCategoryChange(id)}
                                placeholder={
                                    anbieterId
                                        ? categoryOptions.length
                                            ? "Kategorie wählen…"
                                            : gruppeMode === "manual"
                                                ? "Keine Kategorien in dieser Gruppe"
                                                : "Keine Kategorien für diesen Anbieter"
                                        : "Zuerst Anbieter wählen"
                                }
                                disabled={!anbieterId}
                                inputRef={categoryInputRef}
                                allowCreate
                                onCreate={(name) => {
                                    if (gruppeMode === "manual") {
                                        if (!effectiveGroupId) return alert("Bitte zuerst Gruppe wählen.");
                                        const id = createCategory(effectiveGroupId, name);
                                        txDraft.set("kategorieId", id);
                                        return;
                                    }
                                    const supplier = anbieter.find((a) => a.id === anbieterId);
                                    const groups = supplier?.gruppen || [];
                                    if (groups.length === 1) {
                                        const gid = groups[0];
                                        const id = createCategory(gid, name);
                                        txDraft.set("kategorieId", id);
                                    } else {
                                        alert("Bitte Kategorie in den Einstellungen anlegen (Gruppenzuordnung erforderlich).");
                                    }
                                }}
                                allowEdit
                                onEdit={(id, newName) => {
                                    const gid =
                                        gruppeMode === "manual" && effectiveGroupId
                                            ? effectiveGroupId
                                            : findGroupIdByCategoryId(id, kategorien);
                                    if (!gid) return;
                                    renameCategory(gid, id, newName);
                                }}
                                onDelete={(id) => {
                                    const gid =
                                        gruppeMode === "manual" && effectiveGroupId
                                            ? effectiveGroupId
                                            : findGroupIdByCategoryId(id, kategorien);
                                    if (!gid) return;
                                    deleteCategory(gid, id);
                                    if (kategorieId === id) txDraft.set("kategorieId", "");
                                }}
                            />

                            {/* 3) Group (auto or manual) */}
                            <div className="mb-2 flex items-center justify-between">
                                <div className="text-base font-medium">Gruppe</div>
                                <button
                                    type="button"
                                    className="text-xs text-gray-600 underline hover:text-gray-800"
                                    onClick={toggleGroupMode}
                                >
                                    {gruppeMode === "auto" ? "manuell wählen" : "automatisch"}
                                </button>
                            </div>

                            {gruppeMode === "auto" ? (
                                <div className="mb-6">
                                    <input
                                        type="text"
                                        value={(() => {
                                            const g = gruppen.find((g) => g.id === effectiveGroupId);
                                            return g ? g.name : "";
                                        })()}
                                        placeholder="automatisch aus Kategorie"
                                        disabled
                                        className="h-12 w-full border shadow-sm border-gray-300 px-3 bg-gray-100 text-gray-600"
                                        aria-readonly
                                    />
                                    <div className="mt-1 text-xs text-gray-500 text-center">automatisch aus Kategorie</div>
                                </div>
                            ) : (
                                <Combobox<Group>
                                    label=""
                                    options={gruppen}
                                    value={gruppeId}
                                    onChange={(id) => onGroupChangeManual(id)}
                                    placeholder="Gruppe wählen…"
                                />
                            )}
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

                {/* Developer Panel (unchanged) */}
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
