// GuestTransactionStep3.tsx
// Best practices: stable IDs (uuid), separate slug, localStorage persistence, clean components, a11y-friendly, minimal side effects.

import PageHeader from "../components/PageHeader.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import Button from "../components/Button";
import Progress from "../components/Progress";

import { Edit3, MoveLeft, Settings } from "lucide-react";

// import Arrowleft from "../assets/Arrowleft.svg?react";
// import Settings from "../assets/Settings.svg?react";
// import PencilIcon from "../assets/PencilIcon.svg?react";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";

// ---------- Icon Types & Renderer ----------

type IconSpec = {
    kind: "lucide" | "emoji";
    value: string;   // e.g. 'Home' for Lucide, or '🏠' for emoji
    color?: string;
};

// If you don't use 'lucide-react', map 'value' to your own SVG component here.
import * as Lucide from "lucide-react";
function IconRenderer({
    icon,
    className = "w-4 h-4",
    title,
}: {
    icon: IconSpec;
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

    const FALLBACK = "CircleHelp";
    const name = icon.value?.trim() || FALLBACK;
    const Cmp = (Lucide as any)[name] ?? (Lucide as any)[FALLBACK];
    return <Cmp className={className} aria-label={title ?? "icon"} title={title} />;
}

// ---------- Types ----------

type Gruppe = { id: string; name: string; slug: string; icon: IconSpec; createdAt: string };
type Anbieter = { id: string; name: string; gruppen: string[] }; // groups by id
type Kategorie = { id: string; name: string };
type KategorienByGroup = Record<string, Kategorie[]>;

// ---------- Utils (pure, side-effect free) ----------

const LS_KEYS = {
    gruppen: "ft_gruppen_v2",
    anbieter: "ft_anbieter_v2",
    kategorien: "ft_kategorien_v2",
};

const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const makeSlug = (s: string) =>
    (s || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

function loadFromLS<T>(key: string): T | null {
    try {
        const s = localStorage.getItem(key);
        return s ? (JSON.parse(s) as T) : null;
    } catch {
        return null;
    }
}
function saveToLS<T>(key: string, val: T) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch { }
}

// ---------- Initial Data (DE) ----------

function initialGruppenDe(): Gruppe[] {
    return [
        { id: newId(), name: "Wohnen", slug: "wohnen", icon: { kind: "lucide", value: "Home" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Lebensmittel & Haushalt", slug: "lebensmittel-haushalt", icon: { kind: "lucide", value: "ShoppingBasket" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Mobilität", slug: "mobilitaet", icon: { kind: "lucide", value: "Car" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Kommunikation & Technik", slug: "kommunikation-technik", icon: { kind: "lucide", value: "Smartphone" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Gesundheit", slug: "gesundheit", icon: { kind: "lucide", value: "HeartPulse" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Kleidung & Pflege", slug: "kleidung-pflege", icon: { kind: "lucide", value: "Shirt" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Bildung & Kurse", slug: "bildung-kurse", icon: { kind: "lucide", value: "GraduationCap" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Kinder & Familie", slug: "kinder-familie", icon: { kind: "lucide", value: "Baby" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Freizeit & Medien", slug: "freizeit-medien", icon: { kind: "lucide", value: "Clapperboard" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Reisen & Urlaub", slug: "reisen-urlaub", icon: { kind: "lucide", value: "Luggage" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Finanzen & Versicherungen", slug: "finanzen-versicherungen", icon: { kind: "lucide", value: "Wallet" }, createdAt: new Date().toISOString() },
        // Analytic slices (optional)
        { id: newId(), name: "Einmalige Anschaffung", slug: "einmalige-anschaffung", icon: { kind: "lucide", value: "PackagePlus" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Abos & Dienste", slug: "abos-dienste", icon: { kind: "lucide", value: "BadgeCheck" }, createdAt: new Date().toISOString() },
        { id: newId(), name: "Online Shopping", slug: "online-shopping", icon: { kind: "lucide", value: "ShoppingCart" }, createdAt: new Date().toISOString() },
    ];
}

function initialKategorienDe(gruppen: Gruppe[]): KategorienByGroup {
    const byName = (n: string) => gruppen.find((g) => g.name === n)?.id ?? "";

    const idWohnen = byName("Wohnen");
    const idLebHaus = byName("Lebensmittel & Haushalt");
    const idMob = byName("Mobilität");
    const idKommTec = byName("Kommunikation & Technik");
    const idGes = byName("Gesundheit");
    const idKleid = byName("Kleidung & Pflege");
    const idBild = byName("Bildung & Kurse");
    const idKinder = byName("Kinder & Familie");
    const idFreizeit = byName("Freizeit & Medien");
    const idReisen = byName("Reisen & Urlaub");
    const idFin = byName("Finanzen & Versicherungen");
    const idEinm = byName("Einmalige Anschaffung");
    const idAbos = byName("Abos & Dienste");
    const idOnline = byName("Online Shopping");

    const K = (name: string) => ({ id: makeSlug(name), name });

    return {
        [idWohnen]: [
            K("Miete (Wohnung)"),
            K("Nebenkosten (Strom/Gas/Wasser)"),
            K("Haushaltsgeräte (z. B. Kühlschrank)"),
            K("Weitere Wohnkosten (Tübingen/Thüringen Wohnung)"),
        ],
        [idLebHaus]: [K("Lebensmittel"), K("Haushaltswaren"), K("Reinigungsmittel"), K("Lieferung")],
        [idMob]: [K("Benzin"), K("Kfz-Service & Reparatur"), K("Parken"), K("ÖPNV & Tickets"), K("Kfz-Versicherung")],
        [idKommTec]: [
            K("Internet"),
            K("TV"),
            K("Mobilfunk (z. B. 'Lenas Telefon', 'Mein Telefon')"),
            K("Hardware & Zubehör (Alienware, Monitor, Böttcher, AppleShop)"),
        ],
        [idGes]: [K("Insulin"), K("Zahnbehandlung"), K("Zahnzusatzversicherung"), K("Krankenversicherung"), K("Apotheke & Medikamente")],
        [idKleid]: [K("Bekleidung (Reserved, Shein)"), K("Kosmetik (Lipgloss, Parfüm)")],
        [idBild]: [K("Buch C1"), K("Musikschule"), K("Kurse / Lernmaterialien")],
        [idKinder]: [K("Ferienlager (z. B. 'Vlad/Jarik')"), K("Spielzeug"), K("Geschenke"), K("Unterstützung (Familie)")],
        [idFreizeit]: [K("Netflix"), K("SweetTV"), K("Rundfunkbeitrag (Radio/TV)"), K("Freizeit (Kino, Café, Events)")],
        [idReisen]: [K("Urlaub (z. B. 05.07 / 10.07)"), K("Reisezubehör (Bollerwagen/Taschen)"), K("Unterkunft")],
        [idFin]: [K("Bankgebühren"), K("Steuern"), K("Versicherungen (nicht Gesundheit)"), K("Rundfunkbeitrag (alternativ hier)")],
        [idEinm]: [K("Großanschaffung (Alienware)"), K("Großanschaffung (Monitor)"), K("Großanschaffung (Kühlschrank)")],
        [idAbos]: [K("Streaming-Abos"), K("Banking/Dienste"), K("Sonstige Abos")],
        [idOnline]: [K("AliExpress"), K("Shein"), K("Reserved"), K("Zubehör (z. B. Kopfhörer)")],
    };
}

// ---------- Generic Combobox (with inline Create/Edit/Delete) ----------

function Combobox({
    label,
    placeholder = "Bitte wählen…",
    options, // [{id, name, icon?}]
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
    options: Array<{ id: string; name: string; icon?: IconSpec }>;
    value: string;
    onChange?: (id: string, option?: { id: string; name: string; icon?: IconSpec }) => void;
    disabled?: boolean;
    required?: boolean;
    helperText?: string;
    allowCreate?: boolean;
    onCreate?: (name: string) => void;
    allowEdit?: boolean;
    onEdit?: (id: string, newName: string) => void;
    onDelete?: (id: string) => void;
}) {
    // UX notes:
    // - Controlled search input + outside click close for predictable behavior
    // - Keyboard a11y can be added later (arrow keys/enter/escape)
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Close popover on outside click
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
                                            {"icon" in o && o.icon ? <IconRenderer icon={o.icon} /> : null}
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

// ---------- Page ----------

export default function GuestTransactionStep3() {
    const navigate = useNavigate();

    // Transaction draft comes from your store; we only mutate selected IDs/names.
    const {
        kind = null,
        date = null,
        gruppeId = "",
        anbieterId = "",
        kategorieId = "",
        incomeType = "",
        quelleId = "",
        quelleName = "",
        remark = "",
    } = useTxDraft();

    const requireCategory = true;

    // Dictionaries (persisted)
    const [gruppen, setGruppen] = useState<Gruppe[]>([]);
    const [anbieter, setAnbieter] = useState<Anbieter[]>([]);
    const [kategorien, setKategorien] = useState<KategorienByGroup>({});

    // Hydrate from localStorage or seed initial data once.
    // --- robust hydration & seeding ---
    useEffect(() => {
        // Dev-reset: .../page?resetDicts=1
        if (new URLSearchParams(location.search).get("resetDicts") === "1") {
            localStorage.removeItem(LS_KEYS.gruppen);
            localStorage.removeItem(LS_KEYS.anbieter);
            localStorage.removeItem(LS_KEYS.kategorien);
        }

        const gLS = loadFromLS<Gruppe[]>(LS_KEYS.gruppen);
        const aLS = loadFromLS<Anbieter[]>(LS_KEYS.anbieter);
        const kLS = loadFromLS<KategorienByGroup>(LS_KEYS.kategorien);

        const hasG = Array.isArray(gLS) && gLS.length > 0;
        const hasA = Array.isArray(aLS) && aLS.length > 0;
        const hasK = kLS && typeof kLS === "object" && Object.keys(kLS).length > 0;

        // 1) Groups: seed once; otherwise keep existing to preserve IDs
        let groups: Gruppe[];
        if (hasG) {
            groups = gLS!;
        } else {
            groups = initialGruppenDe(); // seed only when no groups at all
            saveToLS(LS_KEYS.gruppen, groups);
        }

        // 2) Providers: build only if missing/empty (use existing group IDs!)
        let providers: Anbieter[];
        if (hasA) {
            providers = aLS!;
        } else {
            const idLeb = groups.find(g => g.slug === "lebensmittel-haushalt")?.id;
            const idMob = groups.find(g => g.slug === "mobilitaet")?.id;
            const idWoh = groups.find(g => g.slug === "wohnen")?.id;

            providers = [
                ...(idLeb ? [{ id: "rewe", name: "Rewe", gruppen: [idLeb] },
                { id: "lidl", name: "Lidl", gruppen: [idLeb] }] : []),
                ...(idMob ? [{ id: "aral", name: "Aral", gruppen: [idMob] },
                { id: "shell", name: "Shell", gruppen: [idMob] }] : []),
                ...(idWoh ? [{ id: "hausverwaltung", name: "Hausverwaltung / Vermieter", gruppen: [idWoh] }] : []),
            ];
            saveToLS(LS_KEYS.anbieter, providers);
        }

        // 3) Categories: build only if missing/empty (use existing group IDs!)
        let cats: KategorienByGroup;
        if (hasK) {
            cats = kLS!;
        } else {
            cats = initialKategorienDe(groups);
            saveToLS(LS_KEYS.kategorien, cats);
        }

        setGruppen(groups);
        setAnbieter(providers);
        setKategorien(cats);
    }, []);



    // Auto-save dictionaries on change (idempotent light writes).
    useEffect(() => saveToLS(LS_KEYS.gruppen, gruppen), [gruppen]);
    useEffect(() => saveToLS(LS_KEYS.anbieter, anbieter), [anbieter]);
    useEffect(() => saveToLS(LS_KEYS.kategorien, kategorien), [kategorien]);




    // Derived option lists based on selected group (expense branch).
    const anbieterOptions = useMemo(() => {
        if (!gruppeId) return anbieter;
        return anbieter.filter((a) => a.gruppen.includes(gruppeId));
    }, [anbieter, gruppeId]);

    const kategorieOptions = useMemo(() => {
        return gruppeId ? kategorien[gruppeId] || [] : [];
    }, [kategorien, gruppeId]);

    // Reset dependent picks when group changes (avoid stale references).
    useEffect(() => {
        if (kind === "expense") {
            txDraft.setMany({ anbieterId: "", kategorieId: "" });
        }
    }, [gruppeId, kind]);

    // Validation: minimal gating to progress.
    const canProceed =
        kind === "income"
            ? Boolean(incomeType && (quelleId || quelleName))
            : kind === "expense"
                ? Boolean(gruppeId && (requireCategory ? kategorieId : true))
                : false;

    // ---------- CRUD Handlers (Groups/Providers/Categories) ----------
    // Groups
    const handleCreateGruppe = (name: string) => {
        const id = newId();
        const slug = makeSlug(name);
        // Default to Lucide; you can switch to emoji by { kind:"emoji", value:"🏷️" }
        const icon: IconSpec = { kind: "lucide", value: "Folder" };
        setGruppen((prev) => [...prev, { id, name, slug, icon, createdAt: new Date().toISOString() }]);
        txDraft.set("gruppeId", id);
    };
    const handleEditGruppe = (id: string, newName: string) => {
        const slug = makeSlug(newName);
        setGruppen((prev) => prev.map((g) => (g.id === id ? { ...g, name: newName, slug } : g)));
    };
    const handleDeleteGruppe = (id: string) => {
        setGruppen((prev) => prev.filter((g) => g.id !== id));
        setAnbieter((prev) => prev.map((a) => ({ ...a, gruppen: a.gruppen.filter((gid) => gid !== id) })));
        setKategorien((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
        if (gruppeId === id) txDraft.setMany({ gruppeId: "", anbieterId: "", kategorieId: "" });
    };

    // Providers
    const handleCreateAnbieter = (name: string) => {
        const id = makeSlug(name) || newId();
        if (anbieter.some((a) => a.id === id)) return alert("Anbieter existiert bereits.");
        const groups = gruppeId ? [gruppeId] : [];
        setAnbieter((prev) => [...prev, { id, name, gruppen: groups }]);
        txDraft.set("anbieterId", id);
    };
    const handleEditAnbieter = (id: string, newName: string) => {
        setAnbieter((prev) => prev.map((a) => (a.id === id ? { ...a, name: newName } : a)));
    };
    const handleDeleteAnbieter = (id: string) => {
        setAnbieter((prev) => prev.filter((a) => a.id !== id));
        if (anbieterId === id) txDraft.set("anbieterId", "");
    };

    // Categories
    const handleCreateKategorie = (name: string) => {
        if (!gruppeId) return alert("Zuerst Gruppe wählen.");
        const id = makeSlug(name) || newId();
        const arr = kategorien[gruppeId] || [];
        if (arr.some((k) => k.id === id)) return alert("Kategorie existiert bereits.");
        setKategorien((prev) => ({ ...prev, [gruppeId]: [...arr, { id, name }] }));
        txDraft.set("kategorieId", id);
    };
    const handleEditKategorie = (id: string, newName: string) => {
        if (!gruppeId) return;
        setKategorien((prev) => ({
            ...prev,
            [gruppeId]: (prev[gruppeId] || []).map((k) => (k.id === id ? { ...k, name: newName } : k)),
        }));
    };
    const handleDeleteKategorie = (id: string) => {
        if (!gruppeId) return;
        setKategorien((prev) => ({
            ...prev,
            [gruppeId]: (prev[gruppeId] || []).filter((k) => k.id !== id),
        }));
        if (kategorieId === id) txDraft.set("kategorieId", "");
    };

    // Income sources (non-persisted for brevity; can be persisted the same way).
    const incomeTypeOptions = [
        { id: "GEHALT", name: "Gehalt" },
        { id: "RENTE", name: "Rente" },
        { id: "MIETE", name: "Mieteinnahme" },
        { id: "VERKAUF", name: "Verkauf" },
        { id: "GESCHENK", name: "Geschenk" },
        { id: "SONSTIGES", name: "Sonstiges" },
    ];
    const [quellen, setQuellen] = useState([
        { id: "arbeitgeber", name: "Arbeitgeber" },
        { id: "rentenversicherung", name: "Rentenversicherung" },
        { id: "mieter", name: "Mieter" },
        { id: "ebay", name: "eBay" },
        { id: "privat", name: "Privat" },
    ]);
    const handleCreateQuelle = (name: string) => {
        const id = makeSlug(name) || newId();
        if (quellen.some((q) => q.id === id)) return alert("Quelle existiert bereits.");
        setQuellen((prev) => [...prev, { id, name }]);
        txDraft.setMany({ quelleId: id, quelleName: name });
    };
    const handleEditQuelle = (id: string, newName: string) => {
        setQuellen((prev) => prev.map((q) => (q.id === id ? { ...q, name: newName } : q)));
        if (quelleId === id) txDraft.set("quelleName", newName);
    };
    const handleDeleteQuelle = (id: string) => {
        setQuellen((prev) => prev.filter((q) => q.id !== id));
        if (quelleId === id) txDraft.setMany({ quelleId: "", quelleName: "" });
    };

    function next() {
        navigate("/TestErgebniss");
    }

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link to="/guestTransactionStep2" className="flex items-center gap-1 text-sm text-gray-600 underline hover:text-gray-800">
                            <MoveLeft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={<Progress step={3} total={4} className="hidden sm:flex w-[120px]" srLabel="Schrittfortschritt" />}
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

                <section className="flex-1">
                    <h1 className="text-lg text-gray-600 mb-4">Demo-Zugang mit lokalem Speicher</h1>

                    {/* -------- Income branch -------- */}
                    {kind === "income" && (
                        <>
                            <Combobox
                                label="Typ (Einnahme)"
                                required
                                options={incomeTypeOptions}
                                value={incomeType}
                                onChange={(id) => txDraft.set("incomeType", id)}
                                placeholder="Typ wählen…"
                            />

                            <Combobox
                                label="Quelle"
                                required
                                options={quellen}
                                value={quelleId || ""}
                                onChange={(id, opt) => txDraft.setMany({ quelleId: id, quelleName: opt?.name ?? "" })}
                                placeholder="z. B. Arbeitgeber"
                                allowCreate
                                onCreate={handleCreateQuelle}
                                allowEdit
                                onEdit={handleEditQuelle}
                                onDelete={handleDeleteQuelle}
                            />
                        </>
                    )}

                    {/* -------- Expense branch -------- */}
                    {kind === "expense" && (
                        <>
                            {/* Group (required) */}
                            <Combobox
                                label="Gruppe"
                                required
                                options={gruppen}
                                value={gruppeId}
                                onChange={(id) => txDraft.set("gruppeId", id)}
                                placeholder="Gruppe wählen…"
                                allowCreate
                                onCreate={handleCreateGruppe}
                                allowEdit
                                onEdit={handleEditGruppe}
                                onDelete={handleDeleteGruppe}
                            />

                            {/* Provider (optional) */}
                            <Combobox
                                label="Anbieter"
                                helperText={gruppeId ? "gefiltert nach Gruppe" : undefined}
                                options={anbieterOptions}
                                value={anbieterId}
                                onChange={(id) => txDraft.set("anbieterId", id)}
                                placeholder="z. B. Rewe"
                                allowCreate
                                onCreate={handleCreateAnbieter}
                                allowEdit
                                onEdit={handleEditAnbieter}
                                onDelete={handleDeleteAnbieter}
                            />

                            {/* Category (required if requireCategory=true) */}
                            <Combobox
                                label="Kategorie"
                                required={requireCategory}
                                options={kategorieOptions}
                                value={kategorieId}
                                onChange={(id) => txDraft.set("kategorieId", id)}
                                placeholder={gruppeId ? "Kategorie wählen…" : "Erst Gruppe wählen"}
                                disabled={!gruppeId}
                                allowCreate
                                onCreate={handleCreateKategorie}
                                allowEdit
                                onEdit={handleEditKategorie}
                                onDelete={handleDeleteKategorie}
                            />
                        </>
                    )}

                    {/* -------- Remark -------- */}
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
                                className="w-full h-24 border shadow-sm border-gray-500 pl-3 pr-3 py-2 
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
            </main>
        </div>
    );
}
