// store/dicts.ts
import { create } from "zustand";
import {
    fetchGruppen, insertGruppe, updateGruppeInDb, deleteGruppeFromDb,
    fetchAnbieter, insertAnbieter, updateAnbieterInDb, deleteAnbieterFromDb,
} from "../repositories/supabaseDictsRepository";
import { supabase } from "../lib/supabase";

// ---- Types ----
export type Gruppe = { id: string; name: string; createdAt: string };
export type Anbieter = { id: string; name: string; gruppenId: string };

// ---- Utils ----
const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ---- Seed data ----
const DEFAULT_GRUPPEN: Omit<Gruppe, "createdAt">[] = [
    { id: newId(), name: "Wohnen" },
    { id: newId(), name: "Lebensmittel & Haushalt" },
    { id: newId(), name: "Mobilität" },
    { id: newId(), name: "Kommunikation & Technik" },
    { id: newId(), name: "Gesundheit" },
    { id: newId(), name: "Kleidung & Pflege" },
    { id: newId(), name: "Bildung & Kurse" },
    { id: newId(), name: "Kinder & Familie" },
    { id: newId(), name: "Freizeit & Medien" },
    { id: newId(), name: "Reisen & Urlaub" },
    { id: newId(), name: "Finanzen & Versicherungen" },
];

const DEFAULT_ANBIETER = [
    { id: newId(), name: "Rewe", gruppenId: "" },
    { id: newId(), name: "Lidl", gruppenId: "" },
    { id: newId(), name: "Aral", gruppenId: "" },
    { id: newId(), name: "Shell", gruppenId: "" },
    { id: newId(), name: "Hausverwaltung / Vermieter", gruppenId: "" },
];

// ---- Store ----
type DictsState = {
    gruppen: Gruppe[];
    anbieter: Anbieter[];
    loaded: boolean;

    loadFromSupabase: () => Promise<void>;
    seedIfEmpty: () => Promise<void>;

    createGroup: (name: string) => Promise<string>;
    renameGroup: (id: string, newName: string) => Promise<void>;
    deleteGroup: (id: string) => Promise<void>;

    createProvider: (name: string, gruppenId?: string) => Promise<string>;
    renameProvider: (id: string, newName: string) => Promise<void>;
    deleteProvider: (id: string) => Promise<void>;
};

export const useDicts = create<DictsState>()(
    (set, get) => ({
        gruppen: [],
        anbieter: [],
        loaded: false,

        loadFromSupabase: async () => {
            try {
                const [gruppen, anbieter] = await Promise.all([
                    fetchGruppen(),
                    fetchAnbieter(),
                ]);
                set({ gruppen, anbieter, loaded: true });

                if (gruppen.length === 0 || anbieter.length === 0) {
                    await get().seedIfEmpty();
                }
            } catch (e) {
                console.error("Dicts load error:", e);
                set({ loaded: true });
            }
        },

        seedIfEmpty: async () => {
            const { data } = await supabase.auth.getSession();
            const userId = data.session?.user?.id;
            if (!userId) return;

            const now = new Date().toISOString();
            const { gruppen: existingGruppen, anbieter: existingAnbieter } = get();

            if (existingGruppen.length === 0) {
                const gruppen = DEFAULT_GRUPPEN.map(g => ({ ...g, createdAt: now }));
                await Promise.all(gruppen.map(g => insertGruppe(g, userId)));
                set({ gruppen });
            }

            if (existingAnbieter.length === 0) {
                const anbieter = DEFAULT_ANBIETER;
                await Promise.all(anbieter.map(a => insertAnbieter(a, userId)));
                set({ anbieter });
            }
        },


        createGroup: async (name) => {
            const id = newId();
            const gruppe: Gruppe = { id, name, createdAt: new Date().toISOString() };
            set((s) => ({ gruppen: [...s.gruppen, gruppe] }));
            const { data } = await supabase.auth.getSession();
            const userId = data.session?.user?.id ?? "";
            await insertGruppe(gruppe, userId);
            return id;
        },

        renameGroup: async (id, newName) => {
            set((s) => ({ gruppen: s.gruppen.map(g => g.id === id ? { ...g, name: newName } : g) }));
            await updateGruppeInDb(id, newName);
        },

        deleteGroup: async (id) => {
            set((s) => ({
                gruppen: s.gruppen.filter(g => g.id !== id),
                anbieter: s.anbieter.map(a => a.gruppenId === id ? { ...a, gruppenId: "" } : a),
            }));
            await deleteGruppeFromDb(id);
        },

        createProvider: async (name, gruppenId = "") => {
            const id = newId();
            const anbieter: Anbieter = { id, name, gruppenId };
            set((s) => ({ anbieter: [...s.anbieter, anbieter] }));
            const { data } = await supabase.auth.getSession();
            const userId = data.session?.user?.id ?? "";
            await insertAnbieter(anbieter, userId);
            return id;
        },

        renameProvider: async (id, newName) => {
            set((s) => ({ anbieter: s.anbieter.map(a => a.id === id ? { ...a, name: newName } : a) }));
            await updateAnbieterInDb(id, newName);
        },

        deleteProvider: async (id) => {
            set((s) => ({ anbieter: s.anbieter.filter(a => a.id !== id) }));
            await deleteAnbieterFromDb(id);
        },
    })
);