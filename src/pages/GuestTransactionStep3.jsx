import PageHeader from "../components/PageHeader.jsx";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import Button from "../components/Button";
import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";
import PencilIcon from "../assets/PencilIcon.svg?react";

import draft from "../store/transactionDraft";



/** Generic searchable Combobox with inline Create/Edit/Delete */
function Combobox({
    label,
    placeholder = "Bitte wählen…",
    options,                  // [{id, name}]
    value,                    // selected id (string)
    onChange,                 // (id, option) => void
    disabled = false,
    required = false,
    helperText,
    allowCreate = false,      // show "＋ Neu hinzufügen"
    onCreate,                 // (name) => void
    allowEdit = false,        // show edit/delete per option
    onEdit,                   // (id, newName) => void
    onDelete,                 // (id) => void
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef(null);

    // close on outside click
    useEffect(() => {
        function onDocClick(e) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const selected = options.find(o => o.id === value) || null;
    const list = useMemo(() => {
        const base = options || [];
        if (!query.trim()) return base;
        const q = query.trim().toLowerCase();
        return base.filter(o => o.name.toLowerCase().includes(q));
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
                    value={open ? query : (selected ? selected.name : "")}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    className={`h-12 w-full border shadow-sm border-gray-500/80 px-3 outline-none placeholder-gray-400
                      focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                      ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={`${label}-listbox`}
                    aria-autocomplete="list"
                />

                {(open && query) && (
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
                    <ul className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-[#F6F0FF] p-2 shadow">
                        {list.map((o) => (
                            <li key={o.id} className="group">
                                <div className="flex w-full items-center justify-between rounded-md px-3 py-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange(o.id, o);
                                            setOpen(false);
                                            setQuery("");
                                        }}
                                        className={`text-left w-full pr-10 transition ${value === o.id ? "bg-white shadow-sm rounded-md px-3 py-2" : "hover:bg-white/70 rounded-md px-3 py-2"}`}
                                        role="option"
                                        aria-selected={value === o.id}
                                    >
                                        {o.name}
                                    </button>

                                    {allowEdit && (
                                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition flex gap-2">
                                            {/* Bearbeiten */}
                                            <button
                                                type="button"
                                                className="p-1 text-blue-400 hover:bg-blue-50 rounded"
                                                onClick={() => {
                                                    const newName = prompt("Neuer Name:", o.name);
                                                    if (newName && newName.trim()) onEdit?.(o.id, newName.trim());
                                                }}
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs text-red-600 hover:underline"
                                                onClick={() => {
                                                    if (confirm(`„${o.name}“ wirklich löschen?`)) onDelete?.(o.id);
                                                }}
                                            >Löschen</button>
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
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-white/70 transition"
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

export default function GuestTransactionStep3() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    // settings gear spin
    const [spinOnce, setSpinOnce] = useState(false);
    const onGearClick = () => {
        if (spinOnce) return;
        setSpinOnce(true);
        setTimeout(() => setSpinOnce(false), 600);
    };

    // ======== DATA in state (editable) ========
    const [gruppen, setGruppen] = useState([
        { id: "essen", name: "Essen & Trinken" },
        { id: "haushalt", name: "Haushalt" },
        { id: "auto", name: "Auto & Verkehr" },
        { id: "miete", name: "Miete" },
        { id: "versicherung", name: "Versicherungen" },
    ]);

    const [anbieter, setAnbieter] = useState([
        { id: "rewe", name: "Rewe", gruppen: ["essen", "haushalt"] },
        { id: "lidl", name: "Lidl", gruppen: ["essen", "haushalt"] },
        { id: "aral", name: "Aral", gruppen: ["auto"] },
        { id: "shell", name: "Shell", gruppen: ["auto"] },
        { id: "vermieter", name: "Hausverwaltung / Vermieter", gruppen: ["miete"] },
        { id: "allianz", name: "Allianz", gruppen: ["versicherung"] },
    ]);

    const [kategorien, setKategorien] = useState({
        essen: [
            { id: "alkohol", name: "Alkohol" },
            { id: "gemuese", name: "Gemüse" },
            { id: "brot", name: "Brot" },
            { id: "snacks", name: "Snacks" },
        ],
        haushalt: [
            { id: "reiniger", name: "Reinigungsmittel" },
            { id: "papier", name: "Haushaltspapier" },
        ],
        auto: [
            { id: "benzin", name: "Benzin" },
            { id: "pflege", name: "Autopflege" },
            { id: "park", name: "Parken" },
        ],
        miete: [
            { id: "warmmiete", name: "Warmmiete" },
            { id: "nebenkosten", name: "Nebenkosten" },
        ],
        versicherung: [
            { id: "haftpflicht", name: "Haftpflicht" },
            { id: "kranken", name: "Krankenversicherung" },
        ],
    });

    // ======== SELECTION ========
    const [gruppeId, setGruppeId] = useState("");
    const [anbieterId, setAnbieterId] = useState(""); // optional
    const [kategorieId, setKategorieId] = useState("");

    // pass-through date
    const date = draft.get?.("date") || null;

    // derived options
    const anbieterOptions = useMemo(() => {
        if (!gruppeId) return anbieter;
        return anbieter.filter(a => a.gruppen.includes(gruppeId));
    }, [anbieter, gruppeId]);

    const kategorieOptions = useMemo(() => {
        return gruppeId ? (kategorien[gruppeId] || []) : [];
    }, [kategorien, gruppeId]);

    // reset dependent on group change
    useEffect(() => {
        setAnbieterId("");
        setKategorieId("");
    }, [gruppeId]);

    // ======== VALIDATION RULE: requireCategory can be toggled ========
    const requireCategory = true; // set to false if you want to proceed with Group only
    const canProceed = Boolean(gruppeId && (requireCategory ? kategorieId : true));

    // ======== CRUD handlers ========
    // Gruppe
    const handleCreateGruppe = (name) => {
        const id = name.toLowerCase().replace(/\s+/g, "-");
        if (gruppen.some(g => g.id === id)) return alert("Gruppe existiert bereits.");
        setGruppen([...gruppen, { id, name }]);
        setGruppeId(id);
    };
    const handleEditGruppe = (id, newName) => {
        setGruppen(gruppen.map(g => g.id === id ? { ...g, name: newName } : g));
    };
    const handleDeleteGruppe = (id) => {
        setGruppen(gruppen.filter(g => g.id !== id));
        // remove links in Anbieter
        setAnbieter(anbieter.map(a => ({ ...a, gruppen: a.gruppen.filter(gid => gid !== id) })));
        // remove kategorien
        const copy = { ...kategorien };
        delete copy[id];
        setKategorien(copy);
        if (gruppeId === id) { setGruppeId(""); setAnbieterId(""); setKategorieId(""); }
    };

    // Anbieter (created under current Gruppe if selected)
    const handleCreateAnbieter = (name) => {
        const id = name.toLowerCase().replace(/\s+/g, "-");
        if (anbieter.some(a => a.id === id)) return alert("Anbieter existiert bereits.");
        const groups = gruppeId ? [gruppeId] : [];
        setAnbieter([...anbieter, { id, name, gruppen: groups }]);
        setAnbieterId(id);
    };
    const handleEditAnbieter = (id, newName) => {
        setAnbieter(anbieter.map(a => a.id === id ? { ...a, name: newName } : a));
    };
    const handleDeleteAnbieter = (id) => {
        setAnbieter(anbieter.filter(a => a.id !== id));
        if (anbieterId === id) setAnbieterId("");
    };

    // Kategorie (belongs to current Gruppe)
    const handleCreateKategorie = (name) => {
        if (!gruppeId) return alert("Zuerst Gruppe wählen.");
        const id = name.toLowerCase().replace(/\s+/g, "-");
        const arr = kategorien[gruppeId] || [];
        if (arr.some(k => k.id === id)) return alert("Kategorie existiert bereits.");
        const next = { ...kategorien, [gruppeId]: [...arr, { id, name }] };
        setKategorien(next);
        setKategorieId(id);
    };
    const handleEditKategorie = (id, newName) => {
        if (!gruppeId) return;
        setKategorien({
            ...kategorien,
            [gruppeId]: (kategorien[gruppeId] || []).map(k => k.id === id ? { ...k, name: newName } : k)
        });
    };
    const handleDeleteKategorie = (id) => {
        if (!gruppeId) return;
        setKategorien({
            ...kategorien,
            [gruppeId]: (kategorien[gruppeId] || []).filter(k => k.id !== id)
        });
        if (kategorieId === id) setKategorieId("");
    };

    // --- remark (note) ---
    const [remark, setRemark] = useState("");   // Text
    const remarkMax = 100;                      // Limit

    // --- Save remark (note) ---
    useEffect(() => {
        draft.set?.("remark", remark);
    }, [remark]);
    const initialRemark = draft.get?.("remark") || "";
    useEffect(() => { if (initialRemark) setRemark(initialRemark); }, []);


    // navigate
    function next() {
        const qs = new URLSearchParams({
            ...Object.fromEntries(params),
            gruppeId,
            anbieterId,
            kategorieId,
            remark,
            date: date ? new Date(date).toISOString() : "",
        }).toString();
        navigate(`/TestErgebniss?${qs}`);
    }

    return (
        <div className="bg-white">
            <style>{`
        @keyframes spin-once { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .rotate-once { animation: spin-once 0.6s linear 1; }
      `}</style>

            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guestTransactionStep2"
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
                            onClick={() => { onGearClick(); }}
                            type="button"
                        >
                            <Settings className={`h-6 w-6 ${spinOnce ? "rotate-once" : ""}`} />
                        </button>
                    }
                />

                <section className="flex-1">
                    <h1 className="text-lg text-gray-600 mb-4">Demo-Zugang ohne Speicherung</h1>


                    {/* GRUPPE (required) */}
                    <Combobox
                        label="Gruppe"
                        required
                        options={gruppen}
                        value={gruppeId}
                        onChange={(id) => setGruppeId(id)}
                        placeholder="Gruppe wählen…"
                        allowCreate
                        onCreate={handleCreateGruppe}
                        allowEdit
                        onEdit={handleEditGruppe}
                        onDelete={handleDeleteGruppe}
                    />

                    {/* ANBIETER (optional) */}
                    <Combobox
                        label="Anbieter"
                        helperText={gruppeId ? "gefiltert nach Gruppe" : undefined}
                        options={anbieterOptions}
                        value={anbieterId}
                        onChange={(id) => setAnbieterId(id)}
                        placeholder="z. B. Rewe"
                        allowCreate
                        onCreate={handleCreateAnbieter}
                        allowEdit
                        onEdit={handleEditAnbieter}
                        onDelete={handleDeleteAnbieter}
                    />

                    {/* KATEGORIE (required if requireCategory=true) */}
                    <Combobox
                        label="Kategorie"
                        required={requireCategory}
                        options={kategorieOptions}
                        value={kategorieId}
                        onChange={(id) => setKategorieId(id)}
                        placeholder={gruppeId ? "Kategorie wählen…" : "Erst Gruppe wählen"}
                        disabled={!gruppeId}
                        allowCreate
                        onCreate={handleCreateKategorie}
                        allowEdit
                        onEdit={handleEditKategorie}
                        onDelete={handleDeleteKategorie}
                    />

                    {/* BEMERKUNG */}
                    <div className="mt-6">
                        <div className="flex justify-center items-center text-black text-base gap-2 font-medium mb-1">
                            <span>Bemerkung</span>
                            <PencilIcon className="w-4 h-4" />
                        </div>

                        <div className="relative">
                            <textarea
                                value={remark}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v.length <= remarkMax) setRemark(v);
                                }}
                                placeholder="Optionale Notiz (z. B. 'Aktion', 'für Schule' …)"
                                className="w-full h-24 border pl-3 pr-3 py-2 shadow-sm
                 focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                 resize-none outline-none placeholder-gray-400"
                                maxLength={remarkMax}
                            />

                            {/* Symbol Count */}
                            <span className="absolute bottom-1 right-3 text-xs text-gray-500">
                                {remark.length}/{remarkMax}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Button variant="primary" onClick={next} disabled={!canProceed}>
                            Weiter
                        </Button>
                    </div>
                </section>
            </main>
        </div >
    );
}
