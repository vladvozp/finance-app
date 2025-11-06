import { useSyncExternalStore } from "react";
import { txDraft } from "../store/transactionDraft";


export function useTxDraft() {
    const subscribe = txDraft.subscribe;
    const getSnapshot = txDraft.get;
    const getServerSnapshot = txDraft.get;

    const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return {
        ...state,
        get: txDraft.get,
        getField: txDraft.getField,
        set: txDraft.set,
        setMany: txDraft.setMany,
        clear: txDraft.clear,
    } as const;
}