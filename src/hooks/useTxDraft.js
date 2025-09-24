import { useSyncExternalStore } from "react";
import { txDraft } from "../store/transactionDraft";


export function useTxDraft() {
    return useSyncExternalStore(txDraft.subscribe, txDraft.get, txDraft.get);
}

