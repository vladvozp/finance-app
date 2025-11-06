// store/index.ts
// Barrel module: re-export all stores and provide common helpers.
// No Provider needed for Zustand.
import { useDicts } from "./dicts";
import { useIncomeDicts } from "./incomeDicts";

// ── Expenses dictionaries (groups/providers/categories)
export * from "./dicts";           // useDicts, types: Gruppe, Anbieter, Kategorie, KategorienByGroup

// ── Income dictionaries (types/sources)
export * from "./incomeDicts";     // useIncomeDicts, types: IncomeType, IncomeSource

// ── Transaction draft (wizard state for the current tx)
export * from "./transactionDraft"; // useTxDraft(), txDraft (if you export both), TxDraft type

// ── Optional: shared LS keys (keep single source of truth)
export const LS_KEYS = {
    dicts: "ft_dicts_v2",
    income: "ft_income_dicts_v1",
    draft: "txDraft", // если у тебя есть persist для черновика
} as const;

// ── Optional: dev helpers (reset + snapshot)
export function resetAllStores() {
    try {
        localStorage.removeItem(LS_KEYS.dicts);
        localStorage.removeItem(LS_KEYS.income);
        localStorage.removeItem(LS_KEYS.draft);
    } catch { }
}

export function getSnapshot() {
    return {
        dicts: useDicts.getState(),
        income: useIncomeDicts.getState(),
        draft: (typeof window !== "undefined") ? JSON.parse(sessionStorage.getItem(LS_KEYS.draft) || "{}") : {},
    };
}