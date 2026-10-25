'use server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/supabase/server';

// Lista blanca de tablas y campos editables (la seguridad real la aplica RLS en Supabase)
const T = {
  vaccinations: ['vaccine_type_id', 'scheduled_date', 'applied_date', 'vet_name_text', 'batch_number', 'observations'],
  medical_records: ['visit_date', 'clinic', 'reason', 'diagnosis', 'treatment', 'notes'],
  medications: ['name', 'dose', 'frequency', 'start_date', 'end_date', 'notes'],
  allergies: ['allergen', 'reaction', 'severity', 'detected_on'],
  feeding_plans: ['stage', 'food_type', 'brand', 'daily_grams', 'meals_per_day', 'schedule', 'start_date', 'end_date', 'notes'],
  food_preferences: ['kind', 'description'],
  weight_logs: ['measured_on', 'weight_kg', 'notes'],
  exercise_logs: ['performed_on', 'exercise_type', 'duration_min', 'intensity', 'notes'],
};
const NUM = ['vaccine_type_id', 'daily_grams', 'meals_per_day', 'weight_kg', 'duration_min'];

export async function addRecord(fd) {
  const table = fd.get('table');
  const petId = fd.get('pet_id');
  if (!T[table]) throw new Error('Tabla no permitida');
  const { sb, user } = await getSession();
  const row = { pet_id: petId };
  for (const c of T[table]) {
    const v = fd.get(c);
    if (v !== null && v !== '') row[c] = NUM.includes(c) ? Number(v) : v;
  }
  if (table === 'vaccinations' || table === 'medical_records') row.created_by = user.id;
  if (table === 'medical_records') row.vet_id = user.id;
  const { error } = await sb.from(table).insert(row);
  if (error) throw new Error(error.message);
  revalidatePath(`/pets/${petId}`);
}

export async function deleteRecord(fd) {
  const table = fd.get('table');
  if (!T[table]) throw new Error('Tabla no permitida');
  const { sb } = await getSession();
  const { error } = await sb.from(table).delete().eq('id', fd.get('id'));
  if (error) throw new Error(error.message);
  revalidatePath(`/pets/${fd.get('pet_id')}`);
}

export async function deletePet(fd) {
  const { sb } = await getSession();
  await sb.from('pets').update({ deleted_at: new Date().toISOString() }).eq('id', fd.get('pet_id'));
  revalidatePath('/');
}
