'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireProfile } from '@/lib/auth';
import { SECTIONS } from '@/lib/sections';

const clean = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return v === null || String(v).trim() === '' ? null : String(v).trim();
};

export async function addRow(sectionKey: string, petId: string, fd: FormData) {
  const s = SECTIONS[sectionKey];
  if (!s) redirect(`/pets/${petId}?error=Sección inválida`);
  const row: Record<string, any> = { pet_id: petId };
  for (const f of s.fields) {
    const v = clean(fd, f.name);
    if (v === null) {
      if (f.required) redirect(`/pets/${petId}?tab=${s.tab}&error=${encodeURIComponent(f.label + ' es obligatorio')}`);
      continue;
    }
    row[f.name] = f.type === 'number' || f.name === 'vaccine_type_id' ? Number(v) : v;
  }
  const supabase = await createClient();
  const { error } = await supabase.from(s.table).insert(row);
  if (error) redirect(`/pets/${petId}?tab=${s.tab}&error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?tab=${s.tab}&ok=Registro guardado`);
}

export async function markApplied(petId: string, id: string) {
  const { supabase, user, profile } = await requireProfile();
  const patch: any = { applied_date: new Date().toISOString().slice(0, 10) };
  if (profile.role === 'admin') { patch.vet_id = user.id; patch.vet_name_text = profile.full_name; }
  const { error } = await supabase.from('vaccinations').update(patch).eq('id', id);
  if (error) redirect(`/pets/${petId}?tab=vacunas&error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?tab=vacunas&ok=Vacuna marcada como aplicada`);
}

export async function deleteRow(sectionKey: string, petId: string, id: string) {
  const s = SECTIONS[sectionKey];
  const supabase = await createClient();
  const { error } = await supabase.from(s.table).delete().eq('id', id);
  if (error) redirect(`/pets/${petId}?tab=${s.tab}&error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?tab=${s.tab}&ok=Registro eliminado`);
}

export async function createPet(fd: FormData) {
  const { supabase, user, isAdmin } = await requireProfile();
  const name = clean(fd, 'name');
  if (!name) redirect('/pets/new?error=El nombre es obligatorio');
  const breed = clean(fd, 'breed_id');
  const row: any = {
    owner_id: isAdmin && clean(fd, 'owner_id') ? clean(fd, 'owner_id') : user.id,
    name, species: clean(fd, 'species') || 'dog', sex: clean(fd, 'sex') || 'unknown',
    breed_id: breed ? Number(breed) : null, breed_other: clean(fd, 'breed_other'),
    birth_date: clean(fd, 'birth_date'), birth_place: clean(fd, 'birth_place'),
    microchip: clean(fd, 'microchip'), color: clean(fd, 'color'),
    origin_type: clean(fd, 'origin_type'), notes: clean(fd, 'notes'),
  };
  const { data, error } = await supabase.from('pets').insert(row).select('id').single();
  if (error) redirect(`/pets/new?error=${encodeURIComponent(error.message)}`);
  redirect(`/pets/${data.id}?ok=Mascota registrada`);
}

export async function archivePet(petId: string) {
  const { supabase } = await requireProfile();
  const { error } = await supabase.from('pets').update({ deleted_at: new Date().toISOString() }).eq('id', petId);
  if (error) redirect(`/pets/${petId}?error=${encodeURIComponent(error.message)}`);
  redirect('/?ok=Mascota archivada');
}

export async function updateProfile(fd: FormData) {
  const { supabase, user } = await requireProfile();
  const { error } = await supabase.from('profiles').update({
    full_name: clean(fd, 'full_name') || '', phone: clean(fd, 'phone'), address_line: clean(fd, 'address_line'),
    city: clean(fd, 'city'), region: clean(fd, 'region'), country: clean(fd, 'country'),
  }).eq('id', user.id);
  if (error) redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  revalidatePath('/', 'layout');
  redirect('/profile?ok=Perfil actualizado');
}

export async function setRole(fd: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(fd.get('id')), role = String(fd.get('role'));
  if (id === user.id && role !== 'admin') redirect('/admin?error=No puedes quitarte tu propio rol de administrador');
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect('/admin?ok=Rol actualizado');
}

export async function addBreed(fd: FormData) {
  const { supabase } = await requireAdmin();
  const name = clean(fd, 'name');
  if (!name) redirect('/admin?t=catalog&error=El nombre es obligatorio');
  const { error } = await supabase.from('breeds').insert({ name, species: clean(fd, 'species') || 'dog', size: clean(fd, 'size') });
  if (error) redirect(`/admin?t=catalog&error=${encodeURIComponent(error.message)}`);
  redirect('/admin?t=catalog&ok=Raza agregada');
}

export async function addVaccineType(fd: FormData) {
  const { supabase } = await requireAdmin();
  const name = clean(fd, 'name'), days = clean(fd, 'interval_days');
  if (!name) redirect('/admin?t=catalog&error=El nombre es obligatorio');
  const { error } = await supabase.from('vaccine_types').insert({
    name, description: clean(fd, 'description'), interval_days: days ? Number(days) : null, species: clean(fd, 'species') || 'all',
  });
  if (error) redirect(`/admin?t=catalog&error=${encodeURIComponent(error.message)}`);
  redirect('/admin?t=catalog&ok=Vacuna agregada al catálogo');
}

export async function toggleCatalog(table: 'breeds' | 'vaccine_types', id: number, active: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from(table).update({ active: !active }).eq('id', id);
  redirect('/admin?t=catalog');
}
