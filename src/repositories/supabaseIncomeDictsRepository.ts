import { supabase } from "../lib/supabase";
import type { IncomeCategory, IncomeSource } from "../store/incomeDicts";

async function getUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!data.user) throw new Error("Not authenticated");

    return data.user.id;
}

// ---- Income Categories ----
export async function fetchIncomeCategories(): Promise<IncomeCategory[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
        .from("income_categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
    }));
}

export async function insertIncomeCategory(
    category: IncomeCategory,
    userId: string
): Promise<void> {
    const { error } = await supabase.from("income_categories").insert({
        id: category.id,
        name: category.name,
        created_at: category.createdAt,
        user_id: userId,
    });

    if (error) throw error;
}

export async function updateIncomeCategoryInDb(
    id: string,
    newName: string
): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
        .from("income_categories")
        .update({
            name: newName,
        })
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw error;
}

export async function deleteIncomeCategoryFromDb(id: string): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
        .from("income_categories")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw error;
}

// ---- Income Sources ----
export async function fetchIncomeSources(): Promise<IncomeSource[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
        .from("income_sources")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
    }));
}

export async function insertIncomeSource(
    source: IncomeSource,
    userId: string
): Promise<void> {
    const { error } = await supabase.from("income_sources").insert({
        id: source.id,
        name: source.name,
        user_id: userId,
    });

    if (error) throw error;
}

export async function updateIncomeSourceInDb(
    id: string,
    newName: string
): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
        .from("income_sources")
        .update({
            name: newName,
        })
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw error;
}

export async function deleteIncomeSourceFromDb(id: string): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
        .from("income_sources")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw error;
}