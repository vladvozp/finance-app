// store/incomeDicts.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type IncomeType = { id: string; name: string };
export type IncomeSource = { id: string; name: string };

type IncomeDictState = {
    incomeTypes: IncomeType[];
    sources: IncomeSource[];

    // CRUD for types
    createType: (name: string) => string;
    renameType: (id: string, newName: string) => void;
    deleteType: (id: string) => void;

    // CRUD for sources
    createSource: (name: string) => string;
    renameSource: (id: string, newName: string) => void;
    deleteSource: (id: string) => void;
};

const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useIncomeDicts = create<IncomeDictState>()(
    persist(
        (set) => ({
            // initial vocab
            incomeTypes: [
                { id: "GEHALT", name: "Gehalt" },
                { id: "RENTE", name: "Rente" },
                { id: "MIETE", name: "Mieteinnahme" },
                { id: "VERKAUF", name: "Verkauf" },
                { id: "GESCHENK", name: "Geschenk" },
                { id: "SONSTIGES", name: "Sonstiges" },
            ],
            sources: [
                { id: "arbeitgeber", name: "Arbeitgeber" },
                { id: "rentenversicherung", name: "Rentenversicherung" },
                { id: "mieter", name: "Mieter" },
                { id: "ebay", name: "eBay" },
                { id: "privat", name: "Privat" },
            ],

            // CRUD for income types
            createType: (name) => {
                const id = newId();
                set((s) => ({ incomeTypes: [...s.incomeTypes, { id, name }] }));
                return id;
            },
            renameType: (id, newName) => {
                set((s) => ({
                    incomeTypes: s.incomeTypes.map((t) =>
                        t.id === id ? { ...t, name: newName } : t
                    ),
                }));
            },
            deleteType: (id) => {
                set((s) => ({ incomeTypes: s.incomeTypes.filter((t) => t.id !== id) }));
            },

            // CRUD for income sources
            createSource: (name) => {
                const id = newId();
                set((s) => ({ sources: [...s.sources, { id, name }] }));
                return id;
            },
            renameSource: (id, newName) => {
                set((s) => ({
                    sources: s.sources.map((src) =>
                        src.id === id ? { ...src, name: newName } : src
                    ),
                }));
            },
            deleteSource: (id) => {
                set((s) => ({ sources: s.sources.filter((src) => src.id !== id) }));
            },
        }),
        {
            name: "ft_income_dicts_v1",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                incomeTypes: state.incomeTypes,
                sources: state.sources,
            }),
        }
    )
);
