"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function setRole(userId: string, formData: FormData) {
  const { supabase, user } = await requireAdmin();
  if (userId === user.id) throw new Error("No puedes cambiar tu propio rol.");
  const role = formData.get("role") as string;
  if (!["owner", "vet", "admin"].includes(role)) throw new Error("Rol inválido");
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

const CATALOGS: Record<string, string[]> = {
  vaccine_types: ["name", "description", "interval_days", "species"],
  breeds: ["name", "size", "species"],
};

export async function addCatalogItem(table: string, formData: FormData) {
  const fields = CATALOGS[table];
  if (!fields) throw new Error("Catálogo no permitido");
  const { supabase } = await requireAdmin();
  const row: Record<string, any> = {};
  for (const f of fields) {
    const raw = ((formData.get(f) as string) || "").trim();
    row[f] = !raw ? null : f === "interval_days" ? Number(raw) : raw;
  }
  const { error } = await supabase.from(table).insert(row);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}

export async function toggleCatalogItem(table: string, id: number, active: boolean) {
  if (!CATALOGS[table]) throw new Error("Catálogo no permitido");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from(table).update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}
