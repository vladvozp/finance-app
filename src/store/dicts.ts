// store/dicts.ts
// single source of truth, stable IDs, local persistence, simple migration.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---- Types ----
export type IconSpec = { kind: "lucide" | "emoji"; value: string; color?: string };
export type Gruppe = { id: string; name: string; slug: string; icon: IconSpec; createdAt: string };
export type Anbieter = { id: string; name: string; gruppen: string[] };
export type Kategorie = { id: string; name: string };
export type KategorienByGroup = Record<string, Kategorie[]>;

// ---- Utils ----
const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const makeSlug = (s: string) =>
    (s || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

// ---- Seeders (DE) ----
function seedGroups(): Gruppe[] {
    const now = () => new Date().toISOString();
    return [
        { id: newId(), name: "Wohnen", slug: "wohnen", icon: { kind: "lucide", value: "Home" }, createdAt: now() },
        { id: newId(), name: "Lebensmittel & Haushalt", slug: "lebensmittel-haushalt", icon: { kind: "lucide", value: "ShoppingBasket" }, createdAt: now() },
        { id: newId(), name: "Mobilität", slug: "mobilitaet", icon: { kind: "lucide", value: "Car" }, createdAt: now() },
        { id: newId(), name: "Kommunikation & Technik", slug: "kommunikation-technik", icon: { kind: "lucide", value: "Smartphone" }, createdAt: now() },
        { id: newId(), name: "Gesundheit", slug: "gesundheit", icon: { kind: "lucide", value: "HeartPulse" }, createdAt: now() },
        { id: newId(), name: "Kleidung & Pflege", slug: "kleidung-pflege", icon: { kind: "lucide", value: "Shirt" }, createdAt: now() },
        { id: newId(), name: "Bildung & Kurse", slug: "bildung-kurse", icon: { kind: "lucide", value: "GraduationCap" }, createdAt: now() },
        { id: newId(), name: "Kinder & Familie", slug: "kinder-familie", icon: { kind: "lucide", value: "Baby" }, createdAt: now() },
        { id: newId(), name: "Freizeit & Medien", slug: "freizeit-medien", icon: { kind: "lucide", value: "Clapperboard" }, createdAt: now() },
        { id: newId(), name: "Reisen & Urlaub", slug: "reisen-urlaub", icon: { kind: "lucide", value: "Luggage" }, createdAt: now() },
        { id: newId(), name: "Finanzen & Versicherungen", slug: "finanzen-versicherungen", icon: { kind: "lucide", value: "Wallet" }, createdAt: now() },
    ];
}

function seedProviders(groups: Gruppe[]): Anbieter[] {
    const id = (slug: string) => groups.find(g => g.slug === slug)?.id;
    const leb = id("lebensmittel-haushalt");
    const mob = id("mobilitaet");
    const woh = id("wohnen");
    const out: Anbieter[] = [];
    if (leb) out.push({ id: "rewe", name: "Rewe", gruppen: [leb] }, { id: "lidl", name: "Lidl", gruppen: [leb] });
    if (mob) out.push({ id: "aral", name: "Aral", gruppen: [mob] }, { id: "shell", name: "Shell", gruppen: [mob] });
    if (woh) out.push({ id: "hausverwaltung", name: "Hausverwaltung / Vermieter", gruppen: [woh] });
    return out;
}

function seedCategories(groups: Gruppe[]): KategorienByGroup {
    const by = (name: string) => groups.find(g => g.name === name)?.id ?? "";
    const K = (name: string) => ({ id: makeSlug(name), name });

    const idWohnen = by("Wohnen");
    const idLeb = by("Lebensmittel & Haushalt");
    const idMob = by("Mobilität");

    return {
        [idWohnen]: [K("Miete (Wohnung)"), K("Nebenkosten (Strom/Gas/Wasser)"), K("Haushaltsgeräte (z. B. Kühlschrank)")],
        [idLeb]: [K("Lebensmittel"), K("Haushaltswaren"), K("Reinigungsmittel"), K("Lieferung")],
        [idMob]: [K("Benzin"), K("Kfz-Service & Reparatur"), K("Parken"), K("ÖPNV & Tickets")],
    };
}

// ---- Store ----
type DictsState = {
    gruppen: Gruppe[];
    anbieter: Anbieter[];
    kategorien: KategorienByGroup;

    // Selectors
    getGroupById: (id: string) => Gruppe | undefined;
    getAnbieterByGroup: (groupId?: string) => Anbieter[];

    // Groups CRUD
    createGroup: (name: string) => string; // returns new id
    renameGroup: (id: string, newName: string) => void;
    deleteGroup: (id: string) => void;

    // Providers CRUD
    createProvider: (name: string, groupId?: string) => string;
    renameProvider: (id: string, newName: string) => void;
    deleteProvider: (id: string) => void;

    // Categories CRUD
    createCategory: (groupId: string, name: string) => string;
    renameCategory: (groupId: string, id: string, newName: string) => void;
    deleteCategory: (groupId: string, id: string) => void;
};

export const useDicts = create<DictsState>()(
    persist(
        (set, get) => {
            // seed once in memory (persist will store it)
            const initialGroups = seedGroups();
            const initialProviders = seedProviders(initialGroups);
            const initialCats = seedCategories(initialGroups);

            return {
                gruppen: initialGroups,
                anbieter: initialProviders,
                kategorien: initialCats,

                // ---- Selectors ----
                getGroupById: (id) => get().gruppen.find(g => g.id === id),
                getAnbieterByGroup: (groupId) => {
                    const all = get().anbieter;
                    if (!groupId) return all;
                    return all.filter(a => a.gruppen.includes(groupId));
                },

                // ---- Groups ----
                createGroup: (name) => {
                    const id = newId();
                    const slug = makeSlug(name);
                    const now = new Date().toISOString();
                    set(state => ({ gruppen: [...state.gruppen, { id, name, slug, icon: { kind: "lucide", value: "Folder" }, createdAt: now }] }));
                    return id;
                },
                renameGroup: (id, newName) => {
                    const slug = makeSlug(newName);
                    set(state => ({ gruppen: state.gruppen.map(g => g.id === id ? { ...g, name: newName, slug } : g) }));
                },
                deleteGroup: (id) => {
                    set(state => ({
                        gruppen: state.gruppen.filter(g => g.id !== id),
                        anbieter: state.anbieter.map(a => ({ ...a, gruppen: a.gruppen.filter(gid => gid !== id) })),
                        kategorien: Object.fromEntries(Object.entries(state.kategorien).filter(([gid]) => gid !== id)),
                    }));
                },

                // ---- Providers ----
                createProvider: (name, groupId) => {
                    const id = makeSlug(name) || newId();
                    set(state => ({
                        anbieter: [
                            ...state.anbieter,
                            { id, name, gruppen: groupId ? [groupId] : [] },
                        ],
                    }));
                    return id;
                },
                renameProvider: (id, newName) => {
                    set(state => ({ anbieter: state.anbieter.map(a => a.id === id ? { ...a, name: newName } : a) }));
                },
                deleteProvider: (id) => {
                    set(state => ({ anbieter: state.anbieter.filter(a => a.id !== id) }));
                },

                // ---- Categories ----
                createCategory: (groupId, name) => {
                    const id = makeSlug(name) || newId();
                    set(state => {
                        const arr = state.kategorien[groupId] || [];
                        if (arr.some(k => k.id === id)) return state; // no-dup
                        return { kategorien: { ...state.kategorien, [groupId]: [...arr, { id, name }] } };
                    });
                    return id;
                },
                renameCategory: (groupId, id, newName) => {
                    set(state => ({
                        kategorien: {
                            ...state.kategorien,
                            [groupId]: (state.kategorien[groupId] || []).map(k => k.id === id ? { ...k, name: newName } : k),
                        },
                    }));
                },
                deleteCategory: (groupId, id) => {
                    set(state => ({
                        kategorien: {
                            ...state.kategorien,
                            [groupId]: (state.kategorien[groupId] || []).filter(k => k.id !== id),
                        },
                    }));
                },
            };
        },
        {
            name: "ft_dicts_v2", // localStorage key (versioned)
            storage: createJSONStorage(() => localStorage),
            // Optional migrations by version:
            // version: 2,
            // migrate: async (persisted, version) => { ...; return persisted; },
            partialize: (state) => ({
                gruppen: state.gruppen,
                anbieter: state.anbieter,
                kategorien: state.kategorien,
            }),
        }
    )
);
