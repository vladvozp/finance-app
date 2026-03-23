import { supabase } from "../lib/supabase";
import type { Gruppe, Anbieter } from "../store/dicts";

async function getUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Not authenticated");
    return data.user.id;
}

// ---- Gruppen ----
export async function fetchGruppen(): Promise<Gruppe[]> {
    const { data, error } = await supabase
        .from("gruppen")
        .select("*")
        .order("created_at");
    if (error) throw error;
    return data.map(row => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
    }));
}

export async function insertGruppe(gruppe: Gruppe, userId: string): Promise<void> {
    const { error } = await supabase.from("gruppen").insert({
        id: gruppe.id,
        name: gruppe.name,
        created_at: gruppe.createdAt,
        user_id: userId,
    });
    if (error) throw error;
}


export async function updateGruppeInDb(id: string, name: string): Promise<void> {
    const { error } = await supabase.from("gruppen").update({ name }).eq("id", id);
    if (error) throw error;
}

export async function deleteGruppeFromDb(id: string): Promise<void> {
    const { error } = await supabase.from("gruppen").delete().eq("id", id);
    if (error) throw error;
}

// ---- Anbieter ----
export async function fetchAnbieter(): Promise<Anbieter[]> {
    const { data, error } = await supabase
        .from("anbieter")
        .select("*")
        .order("created_at");
    if (error) throw error;
    return data.map(row => ({
        id: row.id,
        name: row.name,
        gruppenId: row.gruppen_id ?? "",
    }));
}

export async function insertAnbieter(anbieter: Anbieter, userId: string): Promise<void> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(anbieter.gruppenId);
    const { error } = await supabase.from("anbieter").insert({
        id: anbieter.id,
        name: anbieter.name,
        gruppen_id: isUUID ? anbieter.gruppenId : null,
        user_id: userId,
    });
    if (error) throw error;
}

export async function updateAnbieterInDb(id: string, name: string): Promise<void> {
    const { error } = await supabase.from("anbieter").update({ name }).eq("id", id);
    if (error) throw error;
}

export async function deleteAnbieterFromDb(id: string): Promise<void> {
    const { error } = await supabase.from("anbieter").delete().eq("id", id);
    if (error) throw error;
}