// store/dicts.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---- Types ----
export type Gruppe = { id: string; name: string; createdAt: string };
export type Anbieter = { id: string; name: string; gruppenId: string };

// ---- Utils ----
const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ---- Seeders ----
function seedGroups(): Gruppe[] {
    const now = new Date().toISOString();
    return [
        { id: newId(), name: "Wohnen", createdAt: now },
        { id: newId(), name: "Lebensmittel & Haushalt", createdAt: now },
        { id: newId(), name: "Mobilität", createdAt: now },
        { id: newId(), name: "Kommunikation & Technik", createdAt: now },
        { id: newId(), name: "Gesundheit", createdAt: now },
        { id: newId(), name: "Kleidung & Pflege", createdAt: now },
        { id: newId(), name: "Bildung & Kurse", createdAt: now },
        { id: newId(), name: "Kinder & Familie", createdAt: now },
        { id: newId(), name: "Freizeit & Medien", createdAt: now },
        { id: newId(), name: "Reisen & Urlaub", createdAt: now },
        { id: newId(), name: "Finanzen & Versicherungen", createdAt: now },
    ];
}

function seedProviders(groups: Gruppe[]): Anbieter[] {
    const id = (name: string) => groups.find(g => g.name === name)?.id ?? "";
    return [
        { id: "rewe", name: "Rewe", gruppenId: id("Lebensmittel & Haushalt") },
        { id: "lidl", name: "Lidl", gruppenId: id("Lebensmittel & Haushalt") },
        { id: "aral", name: "Aral", gruppenId: id("Mobilität") },
        { id: "shell", name: "Shell", gruppenId: id("Mobilität") },
        { id: "hausverwaltung", name: "Hausverwaltung / Vermieter", gruppenId: id("Wohnen") },
    ];
}

// ---- Store ----
type DictsState = {
    gruppen: Gruppe[];
    anbieter: Anbieter[];

    // Groups CRUD
    createGroup: (name: string) => string;
    renameGroup: (id: string, newName: string) => void;
    deleteGroup: (id: string) => void;

    // Providers CRUD
    createProvider: (name: string, gruppenId?: string) => string;
    renameProvider: (id: string, newName: string) => void;
    deleteProvider: (id: string) => void;
};

export const useDicts = create<DictsState>()(
    persist(
        (set) => {
            const initialGroups = seedGroups();
            const initialProviders = seedProviders(initialGroups);

            return {
                gruppen: initialGroups,
                anbieter: initialProviders,

                // ---- Groups ----
                createGroup: (name) => {
                    const id = newId();
                    const now = new Date().toISOString();
                    set(s => ({ gruppen: [...s.gruppen, { id, name, createdAt: now }] }));
                    return id;
                },
                renameGroup: (id, newName) => {
                    set(s => ({ gruppen: s.gruppen.map(g => g.id === id ? { ...g, name: newName } : g) }));
                },
                deleteGroup: (id) => {
                    set(s => ({
                        gruppen: s.gruppen.filter(g => g.id !== id),
                        anbieter: s.anbieter.map(a => a.gruppenId === id ? { ...a, gruppenId: "" } : a),
                    }));
                },

                // ---- Providers ----
                createProvider: (name, gruppenId = "") => {
                    const id = newId();
                    set(s => ({ anbieter: [...s.anbieter, { id, name, gruppenId }] }));
                    return id;
                },
                renameProvider: (id, newName) => {
                    set(s => ({ anbieter: s.anbieter.map(a => a.id === id ? { ...a, name: newName } : a) }));
                },
                deleteProvider: (id) => {
                    set(s => ({ anbieter: s.anbieter.filter(a => a.id !== id) }));
                },
            };
        },
        {
            name: "ft_dicts_v3",
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                gruppen: s.gruppen,
                anbieter: s.anbieter,
            }),
        }
    )
);