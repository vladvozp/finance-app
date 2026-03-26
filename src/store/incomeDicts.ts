import { create } from "zustand";
import {
    fetchIncomeCategories,
    insertIncomeCategory,
    updateIncomeCategoryInDb,
    deleteIncomeCategoryFromDb,
    fetchIncomeSources,
    insertIncomeSource,
    updateIncomeSourceInDb,
    deleteIncomeSourceFromDb,
} from "../repositories/supabaseIncomeDictsRepository";
import { supabase } from "../lib/supabase";

// ---- Types ----
export type IncomeCategory = {
    id: string;
    name: string;
    createdAt: string;
};

export type IncomeSource = {
    id: string;
    name: string;
};

// ---- Utils ----
const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ---- Seed data ----
const DEFAULT_INCOME_CATEGORIES: Omit<IncomeCategory, "createdAt">[] = [
    { id: newId(), name: "Gehalt" },
    { id: newId(), name: "Wohngeld" },
    { id: newId(), name: "Minijob" },
    { id: newId(), name: "Bonus" },
    { id: newId(), name: "Verkauf" },
    { id: newId(), name: "Sonstiges" },
];

const DEFAULT_INCOME_SOURCES: IncomeSource[] = [
    { id: newId(), name: "Arbeitgeber" },
    { id: newId(), name: "Stadt" },
    { id: newId(), name: "Jobcenter" },
    { id: newId(), name: "Privat" },
    { id: newId(), name: "Projekt" },
];

// ---- Store ----
type IncomeDictState = {
    categories: IncomeCategory[];
    sources: IncomeSource[];
    loaded: boolean;

    loadFromSupabase: () => Promise<void>;
    seedIfEmpty: () => Promise<void>;

    createCategory: (name: string) => Promise<string>;
    renameCategory: (id: string, newName: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    createSource: (name: string) => Promise<string>;
    renameSource: (id: string, newName: string) => Promise<void>;
    deleteSource: (id: string) => Promise<void>;
};

export const useIncomeDicts = create<IncomeDictState>()((set, get) => ({
    categories: [],
    sources: [],
    loaded: false,

    loadFromSupabase: async () => {
        try {
            const [categories, sources] = await Promise.all([
                fetchIncomeCategories(),
                fetchIncomeSources(),
            ]);

            set({
                categories,
                sources,
                loaded: true,
            });

            await get().seedIfEmpty();
        } catch (e) {
            console.error("Income dicts load error:", e);
            set({ loaded: true });
        }
    },

    seedIfEmpty: async () => {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId) return;

        const now = new Date().toISOString();
        const { categories: existingCategories, sources: existingSources } = get();

        if (existingCategories.length === 0) {
            const categories = DEFAULT_INCOME_CATEGORIES.map((c) => ({
                ...c,
                createdAt: now,
            }));

            await Promise.all(categories.map((c) => insertIncomeCategory(c, userId)));
            set({ categories });
        }

        if (existingSources.length === 0) {
            const sources = DEFAULT_INCOME_SOURCES;

            await Promise.all(sources.map((s) => insertIncomeSource(s, userId)));
            set({ sources });
        }
    },

    createCategory: async (name) => {
        const id = newId();
        const category: IncomeCategory = {
            id,
            name,
            createdAt: new Date().toISOString(),
        };

        set((s) => ({
            categories: [...s.categories, category],
        }));

        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? "";

        await insertIncomeCategory(category, userId);
        return id;
    },

    renameCategory: async (id, newName) => {
        set((s) => ({
            categories: s.categories.map((c) =>
                c.id === id ? { ...c, name: newName } : c
            ),
        }));

        await updateIncomeCategoryInDb(id, newName);
    },

    deleteCategory: async (id) => {
        set((s) => ({
            categories: s.categories.filter((c) => c.id !== id),
        }));

        await deleteIncomeCategoryFromDb(id);
    },

    createSource: async (name) => {
        const id = newId();
        const source: IncomeSource = {
            id,
            name,
        };

        set((s) => ({
            sources: [...s.sources, source],
        }));

        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? "";

        await insertIncomeSource(source, userId);
        return id;
    },

    renameSource: async (id, newName) => {
        set((s) => ({
            sources: s.sources.map((src) =>
                src.id === id ? { ...src, name: newName } : src
            ),
        }));

        await updateIncomeSourceInDb(id, newName);
    },

    deleteSource: async (id) => {
        set((s) => ({
            sources: s.sources.filter((src) => src.id !== id),
        }));

        await deleteIncomeSourceFromDb(id);
    },
}));