"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

type Kind = "s" | "n" | "int";
const TABLES: Record<string, Record<string, Kind>> = {
  vaccinations: { vaccine_type_id: "int", scheduled_date: "s", applied_date: "s", vet_name_text: "s", batch_number: "s", observations: "s" },
  medical_records: { visit_date: "s", clinic: "s", reason: "s", diagnosis: "s", treatment: "s", notes: "s" },
  medications: { name: "s", dose: "s", frequency: "s", start_date: "s", end_date: "s", notes: "s" },
  allergies: { allergen: "s", reaction: "s", severity: "s", detected_on: "s" },
  feeding_plans: { stage: "s", food_type: "s", brand: "s", daily_grams: "n", meals_per_day: "int", schedule: "s", start_date: "s", end_date: "s", notes: "s" },
  food_preferences: { kind: "s", description: "s" },
  weight_logs: { measured_on: "s", weight_kg: "n", notes: "s" },
  exercise_logs: { performed_on: "s", exercise_type: "s", duration_min: "int", intensity: "s", notes: "s" },
};

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createPet(formData: FormData) {
  const { supabase, user } = await requireUser();
  const breed = formData.get("breed_id") as string;
  const { data, error } = await supabase.from("pets").insert({
    owner_id: user.id,
    name: formData.get("name") as string,
    species: formData.get("species") as string,
    breed_id: breed ? Number(breed) : null,
    breed_other: (formData.get("breed_other") as string) || null,
    sex: formData.get("sex") as string,
    birth_date: (formData.get("birth_date") as string) || null,
    birth_place: (formData.get("birth_place") as string) || null,
    color: (formData.get("color") as string) || null,
  }).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/pets/${data.id}`);
}

export async function updatePet(petId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const s = (k: string) => ((formData.get(k) as string) || null);
  const { error } = await supabase.from("pets").update({
    name: formData.get("name") as string, breed_other: s("breed_other"), sex: formData.get("sex") as string,
    birth_date: s("birth_date"), birth_place: s("birth_place"), color: s("color"),
    microchip: s("microchip"), notes: s("notes"), updated_at: new Date().toISOString(),
  }).eq("id", petId);
  if (error) throw new Error(error.message);
  revalidatePath(`/pets/${petId}`);
}

export async function archivePet(petId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("pets").update({ deleted_at: new Date().toISOString() }).eq("id", petId);
  if (error) throw new Error(error.message);
  redirect("/pets");
}

export async function uploadPhoto(petId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const file = formData.get("photo") as File;
  if (!file || !file.size) return;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/${petId}.${ext}`;
  const up = await supabase.storage.from("pet-photos").upload(path, file, { upsert: true, contentType: file.type });
  if (up.error) throw new Error(up.error.message);
  const { error } = await supabase.from("pets").update({ photo_path: path }).eq("id", petId);
  if (error) throw new Error(error.message);
  revalidatePath(`/pets/${petId}`);
}

export async function addRecord(table: string, petId: string, formData: FormData) {
  const spec = TABLES[table];
  if (!spec) throw new Error("Tabla no permitida");
  const { supabase, user, profile } = await requireUser();
  const row: Record<string, any> = { pet_id: petId };
  for (const [k, kind] of Object.entries(spec)) {
    const raw = (formData.get(k) as string | null)?.trim();
    row[k] = !raw ? null : kind === "s" ? raw : Number(raw);
  }
  if (profile.role === "vet" && (table === "vaccinations" || table === "medical_records")) {
    row.vet_id = user.id;
    if (table === "vaccinations" && !row.vet_name_text) row.vet_name_text = profile.full_name;
  }
  const { error } = await supabase.from(table).insert(row);
  if (error) throw new Error(error.message);
  revalidatePath(`/pets/${petId}`);
}

export async function deleteRecord(table: string, petId: string, id: string) {
  if (!TABLES[table]) throw new Error("Tabla no permitida");
  const { supabase } = await requireUser();
  const { error } = await supabase.from(table).delete().eq("id", id).eq("pet_id", petId);
  if (error) throw new Error(error.message);
  revalidatePath(`/pets/${petId}`);
}

export async function grantVet(petId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("grant_vet_access", { p_pet: petId, p_email: formData.get("email") as string });
  if (error) redirect(`/pets/${petId}?tab=veterinarios&error=${encodeURIComponent(error.message)}`);
  redirect(`/pets/${petId}?tab=veterinarios`);
}

export async function revokeVet(petId: string, vetId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("pet_vets").delete().eq("pet_id", petId).eq("vet_id", vetId);
  if (error) throw new Error(error.message);
  revalidatePath(`/pets/${petId}`);
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const s = (k: string) => ((formData.get(k) as string) || null);
  const { error } = await supabase.from("profiles").update({
    full_name: formData.get("full_name") as string, phone: s("phone"), address_line: s("address_line"),
    city: s("city"), region: s("region"), country: s("country"), updated_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile");
}
