import { supabase } from "../lib/supabase";
import type { Account } from "../types/account";
import type { Tx } from "../types/tx";

async function getUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!data.user) throw new Error("Not authenticated");

    return data.user.id;
}

// ---- Accounts ----
export async function fetchAccounts(): Promise<Account[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at");

    if (error) throw error;

    return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        currency: row.currency,
        openingBalance: row.opening_balance,
        openingDate: row.opening_date,
        snapshotBalance: row.snapshot_balance,
        snapshotAt: row.snapshot_at,
        isMain: row.is_main,
        archived: row.archived,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

export async function insertAccount(acc: Account): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase.from("accounts").insert({
        id: acc.id,
        name: acc.name,
        currency: acc.currency,
        opening_balance: acc.openingBalance,
        opening_date: acc.openingDate,
        snapshot_balance: acc.snapshotBalance,
        snapshot_at: acc.snapshotAt,
        is_main: acc.isMain,
        archived: acc.archived,
        created_at: acc.createdAt,
        updated_at: acc.updatedAt,
        user_id: userId,
    });

    if (error) throw error;
}

export async function updateAccountInDb(
    id: string,
    patch: Partial<Account>
): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
        .from("accounts")
        .update({
            name: patch.name,
            currency: patch.currency,
            opening_balance: patch.openingBalance,
            opening_date: patch.openingDate,
            snapshot_balance: patch.snapshotBalance,
            snapshot_at: patch.snapshotAt,
            is_main: patch.isMain,
            archived: patch.archived,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw error;
}

export async function deleteAccountFromDb(id: string): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw error;
}

// ---- Transactions ----
export async function fetchTransactions(): Promise<Tx[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at");

    if (error) throw error;

    return (data ?? []).map((row) => ({
        id: row.id,
        kind: row.kind,
        amount: row.amount,
        date: row.date,
        createdAt: row.created_at,
        status: row.status,
        isPlanned: row.is_planned,
        gruppeId: row.gruppe_id,
        anbieterId: row.anbieter_id,
        kontoId: row.konto_id,
        remark: row.remark,
        repeat: row.repeat,
    }));
}

export async function insertTransaction(tx: Tx): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase.from("transactions").insert({
        id: tx.id,
        kind: tx.kind,
        amount: tx.amount,
        date: tx.date,
        created_at: tx.createdAt,
        status: tx.status,
        is_planned: tx.isPlanned,
        gruppe_id: tx.gruppeId,
        anbieter_id: tx.anbieterId,
        konto_id: tx.kontoId,
        remark: tx.remark,
        repeat: tx.repeat,
        user_id: userId,
    });

    if (error) throw error;
}

export async function updateTransactionInDb(
    id: string,
    patch: Partial<Tx>
): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
        .from("transactions")
        .update({
            kind: patch.kind,
            amount: patch.amount,
            date: patch.date,
            status: patch.status,
            is_planned: patch.isPlanned,
            gruppe_id: patch.gruppeId,
            anbieter_id: patch.anbieterId,
            konto_id: patch.kontoId,
            remark: patch.remark,
            repeat: patch.repeat,
        })
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw error;
}

export async function deleteTransactionFromDb(id: string): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw error;
}