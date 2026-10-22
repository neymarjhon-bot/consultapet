"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createPet(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
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

export async function addVaccination(petId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("vaccinations").insert({
    pet_id: petId,
    vaccine_type_id: Number(formData.get("vaccine_type_id")),
    scheduled_date: formData.get("scheduled_date") as string,
    applied_date: (formData.get("applied_date") as string) || null,
    vet_name_text: (formData.get("vet_name_text") as string) || null,
    batch_number: (formData.get("batch_number") as string) || null,
    observations: (formData.get("observations") as string) || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/pets/${petId}`);
}

export async function addWeight(petId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("weight_logs").insert({
    pet_id: petId,
    measured_on: formData.get("measured_on") as string,
    weight_kg: Number(formData.get("weight_kg")),
    notes: (formData.get("notes") as string) || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/pets/${petId}`);
}
