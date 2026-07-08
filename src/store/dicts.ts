// store/dicts.ts
import { create } from "zustand";
import {
    fetchGruppen, insertGruppe, updateGruppeInDb, deleteGruppeFromDb,
    fetchAnbieter, insertAnbieter, updateAnbieterInDb, deleteAnbieterFromDb,
} from "../repositories/supabaseDictsRepository";
import { supabase } from "../lib/supabase";

// ---- Types ----

export type PaymentType =
    | "normal"
    | "fixed"
    | "subscription"
    | "installment"
    | "savings";

export const paymentTypeLabels: Record<PaymentType, string> = {
    normal: "Normal",
    fixed: "Fixkosten",
    subscription: "Abo",
    installment: "Ratenzahlung",
    savings: "Sparkonto"
};

export type PlanType = "limit" | "target";

export const planTypeLabels: Record<PlanType, string> = {
    limit: "Limit",
    target: "Ziel"
};

export type BudgetGroup =
    | "required"
    | "free"
    | "future";

export const budgetGroupLabels: Record<BudgetGroup, string> = {
    required: "Notwendig",
    free: "Frei verfügbar",
    future: "Zukunft"
};

export type Gruppe = {
    id: string;
    name: string;
    createdAt: string;

    paymentType?: PaymentType;
    budgetGroup?: BudgetGroup;
    planType?: PlanType;
    planAmount?: number | null;
};

export type Anbieter = {
    id: string;
    name: string;
    gruppenId: string;
};

// ---- Utils ----
const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ---- Seed data ----
const DEFAULT_GRUPPEN: Omit<Gruppe, "createdAt">[] = [
    {
        id: newId(),
        name: "Wohnen",
        paymentType: "fixed",
        budgetGroup: "required",
        planType: "limit",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Lebensmittel & Haushalt",
        paymentType: "normal",
        budgetGroup: "required",
        planType: "limit",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Mobilität",
        paymentType: "normal",
        budgetGroup: "required",
        planType: "limit",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Kommunikation & Technik",
        paymentType: "subscription",
        budgetGroup: "required",
        planType: "limit",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Gesundheit",
        paymentType: "normal",
        budgetGroup: "required",
        planType: "limit",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Kleidung & Pflege",
        paymentType: "normal",
        budgetGroup: "free",
        planType: "limit",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Bildung & Kurse",
        paymentType: "normal",
        budgetGroup: "future",
        planType: "target",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Kinder & Familie",
        paymentType: "normal",
        budgetGroup: "required",
        planType: "limit",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Freizeit & Medien",
        paymentType: "subscription",
        budgetGroup: "free",
        planType: "limit",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Reisen & Urlaub",
        paymentType: "savings",
        budgetGroup: "future",
        planType: "target",
        planAmount: null,
    },
    {
        id: newId(),
        name: "Finanzen & Versicherungen",
        paymentType: "fixed",
        budgetGroup: "required",
        planType: "limit",
        planAmount: null,
    },
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

    createGroup: (
        name: string,
        options?: Partial<Omit<Gruppe, "id" | "name" | "createdAt">>
    ) => Promise<string>;

    renameGroup: (id: string, newName: string) => Promise<void>;
    deleteGroup: (id: string) => Promise<void>;

    updateGroupSettings: (
        id: string,
        patch: {
            paymentType?: PaymentType;
            budgetGroup?: BudgetGroup;
            planType?: PlanType;
            planAmount?: number | null;
        }
    ) => Promise<void>;

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



        createGroup: async (name, options = {}) => {
            const id = newId();

            const gruppe: Gruppe = {
                id,
                name,
                createdAt: new Date().toISOString(),
                paymentType: options.paymentType ?? "normal",
                budgetGroup: options.budgetGroup ?? "free",
                planType: options.planType ?? "limit",
                planAmount: options.planAmount ?? null,
            };

            set((s) => ({ gruppen: [...s.gruppen, gruppe] }));

            const { data } = await supabase.auth.getSession();
            const userId = data.session?.user?.id ?? "";

            await insertGruppe(gruppe, userId);

            return id;
        },

        renameGroup: async (id, newName) => {
            set((s) => ({ gruppen: s.gruppen.map(g => g.id === id ? { ...g, name: newName } : g) }));
            await updateGruppeInDb(id, { name: newName });
        },

        deleteGroup: async (id) => {
            set((s) => ({
                gruppen: s.gruppen.filter(g => g.id !== id),
                anbieter: s.anbieter.map(a => a.gruppenId === id ? { ...a, gruppenId: "" } : a),
            }));
            await deleteGruppeFromDb(id);
        },

        updateGroupSettings: async (id, patch) => {
            set((s) => ({
                gruppen: s.gruppen.map(g =>
                    g.id === id ? { ...g, ...patch } : g
                )
            }));

            await updateGruppeInDb(id, patch);
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