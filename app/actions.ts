'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, requireProfile, requireStaff } from '@/lib/auth';
import { SECTIONS } from '@/lib/sections';
import { addDays, today } from '@/lib/format';
import { notifyVaccine } from '@/lib/email';

const clean = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return v === null || String(v).trim() === '' ? null : String(v).trim();
};
const enc = encodeURIComponent;

// Traduce los errores más comunes de la base de datos a mensajes comprensibles
function friendly(msg: string) {
  if (/pets_microchip_key/.test(msg)) return 'Ese microchip ya está registrado en otra mascota.';
  if (/pets_microchip_format/.test(msg)) return 'El microchip debe tener exactamente 15 dígitos.';
  if (/weight_logs_pet_id_measured_on_key/.test(msg)) return 'Ya existe un pesaje para esa fecha.';
  if (/row-level security|permission denied/i.test(msg)) return 'No tienes permiso para realizar esta acción.';
  if (/duplicate key/.test(msg)) return 'Ese registro ya existe.';
  return msg;
}

export async function addRow(sectionKey: string, petId: string, fd: FormData) {
  const s = SECTIONS[sectionKey];
  if (!s) redirect(`/pets/${petId}?error=Sección inválida`);
  const { supabase, user, profile } = await requireStaff();
  const row: Record<string, any> = { pet_id: petId };
  for (const f of s.fields) {
    const v = clean(fd, f.name);
    if (v === null) {
      if (f.required) redirect(`/pets/${petId}?tab=${s.tab}&error=${enc(f.label + ' es obligatorio')}`);
      continue;
    }
    row[f.name] = f.type === 'number' || f.name === 'vaccine_type_id' ? Number(v) : v;
  }
  // quién registra la atención o la vacuna
  if (s.key === 'medical_records') row.vet_id = user.id;
  if (s.key === 'vaccinations') {
    row.vet_id = user.id;
    if (!row.vet_name_text) row.vet_name_text = profile.full_name || profile.email;
  }
  const { data, error } = await supabase.from(s.table).insert(row).select('id').single();
  if (error) redirect(`/pets/${petId}?tab=${s.tab}&error=${enc(friendly(error.message))}`);

  let note = 'Registro guardado';
  if (s.key === 'vaccinations' && data) {
    if (!row.applied_date) {
      // el veterinario agendó una vacuna: aviso al dueño
      const r = await notifyVaccine(supabase, data.id, 'vaccine_scheduled');
      if (r === 'sent') note = 'Vacuna agendada y aviso enviado al dueño';
    } else {
      // se registró como aplicada: la base programa el refuerzo y se avisa al dueño
      const r = await notifyNextDose(supabase, petId, row.vaccine_type_id, row.applied_date);
      if (r === 'sent') note = 'Vacuna registrada; próxima dosis programada y aviso enviado al dueño';
    }
  }
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?tab=${s.tab}&ok=${enc(note)}`);
}

async function notifyNextDose(supabase: any, petId: string, vaccineTypeId: number, appliedDate: string) {
  const { data: vt } = await supabase.from('vaccine_types').select('interval_days').eq('id', vaccineTypeId).maybeSingle();
  if (!vt?.interval_days) return 'skipped';
  const { data: next } = await supabase.from('vaccinations').select('id')
    .eq('pet_id', petId).eq('vaccine_type_id', vaccineTypeId).is('applied_date', null)
    .eq('scheduled_date', addDays(vt.interval_days, appliedDate)).maybeSingle();
  return next ? notifyVaccine(supabase, next.id, 'next_dose') : 'skipped';
}

export async function markApplied(petId: string, id: string) {
  const { supabase, user, profile } = await requireStaff();
  const applied = today(); // fecha de Chile, no UTC
  const { data: v, error } = await supabase.from('vaccinations')
    .update({ applied_date: applied, vet_id: user.id, vet_name_text: profile.full_name || profile.email })
    .eq('id', id).select('vaccine_type_id').single();
  if (error) redirect(`/pets/${petId}?tab=vacunas&error=${enc(friendly(error.message))}`);
  const r = await notifyNextDose(supabase, petId, v.vaccine_type_id, applied);
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?tab=vacunas&ok=${enc(r === 'sent' ? 'Vacuna aplicada; próxima dosis programada y aviso enviado al dueño' : 'Vacuna marcada como aplicada')}`);
}

export async function deleteRow(sectionKey: string, petId: string, id: string) {
  const s = SECTIONS[sectionKey];
  const { supabase } = await requireStaff();
  const { error } = await supabase.from(s.table).delete().eq('id', id);
  if (error) redirect(`/pets/${petId}?tab=${s.tab}&error=${enc(friendly(error.message))}`);
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?tab=${s.tab}&ok=Registro eliminado`);
}

export async function createPet(fd: FormData) {
  const { supabase, user, isAdmin, canManagePets } = await requireProfile();
  if (!canManagePets) redirect('/?error=' + enc('Las mascotas las registran sus dueños o el administrador'));
  const name = clean(fd, 'name');
  if (!name) redirect('/pets/new?error=El nombre es obligatorio');
  const microchip = clean(fd, 'microchip');
  if (microchip && !/^[0-9]{15}$/.test(microchip)) redirect('/pets/new?error=' + enc('El microchip debe tener exactamente 15 dígitos.'));
  const breed = clean(fd, 'breed_id');
  const row: any = {
    owner_id: isAdmin && clean(fd, 'owner_id') ? clean(fd, 'owner_id') : user.id,
    name, species: clean(fd, 'species') || 'dog', sex: clean(fd, 'sex') || 'unknown',
    breed_id: breed ? Number(breed) : null, breed_other: clean(fd, 'breed_other'),
    birth_date: clean(fd, 'birth_date'), birth_place: clean(fd, 'birth_place'),
    microchip, color: clean(fd, 'color'),
    origin_type: clean(fd, 'origin_type'), notes: clean(fd, 'notes'),
  };
  const { data, error } = await supabase.from('pets').insert(row).select('id').single();
  if (error) redirect(`/pets/new?error=${enc(friendly(error.message))}`);
  redirect(`/pets/${data.id}?ok=Mascota registrada`);
}

export async function archivePet(petId: string) {
  const { supabase, canManagePets } = await requireProfile();
  if (!canManagePets) redirect(`/pets/${petId}?error=${enc('No tienes permiso para archivar mascotas')}`);
  const { error } = await supabase.from('pets').update({ deleted_at: new Date().toISOString() }).eq('id', petId);
  if (error) redirect(`/pets/${petId}?error=${enc(friendly(error.message))}`);
  redirect('/?ok=Mascota archivada');
}

export async function assignVet(petId: string, fd: FormData) {
  const { supabase } = await requireAdmin();
  const vetId = clean(fd, 'vet_id');
  if (!vetId) redirect(`/pets/${petId}?error=${enc('Selecciona un veterinario')}`);
  const { error } = await supabase.from('pet_vets').insert({ pet_id: petId, vet_id: vetId });
  if (error) redirect(`/pets/${petId}?error=${enc(friendly(error.message))}`);
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?ok=Veterinario asignado`);
}

export async function removeVet(petId: string, vetId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('pet_vets').delete().eq('pet_id', petId).eq('vet_id', vetId);
  if (error) redirect(`/pets/${petId}?error=${enc(friendly(error.message))}`);
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?ok=Asignación eliminada`);
}

export async function updateProfile(fd: FormData) {
  const { supabase, user, isOwner } = await requireProfile();
  const patch: Record<string, any> = {
    full_name: clean(fd, 'full_name') || '', phone: clean(fd, 'phone'), address_line: clean(fd, 'address_line'),
    city: clean(fd, 'city'), region: clean(fd, 'region'),
  };
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) redirect(`/profile?error=${enc(friendly(error.message))}`);
  if (isOwner) {
    const enabled = fd.get('email_enabled') === 'on';
    const { error: e2 } = await supabase.from('notification_preferences').upsert({
      owner_id: user.id, email_enabled: enabled,
      remind_7d: fd.get('remind_7d') === 'on', remind_1d: fd.get('remind_1d') === 'on',
      consent_at: enabled ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
    }, { onConflict: 'owner_id' });
    if (e2) redirect(`/profile?error=${enc(friendly(e2.message))}`);
  }
  revalidatePath('/', 'layout');
  redirect('/profile?ok=Perfil actualizado');
}

export async function setRole(fd: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(fd.get('id')), role = String(fd.get('role'));
  if (!['owner', 'vet', 'admin'].includes(role)) redirect('/admin?error=Rol inválido');
  if (id === user.id && role !== 'admin') redirect('/admin?error=No puedes quitarte tu propio rol de administrador');
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) redirect(`/admin?error=${enc(friendly(error.message))}`);
  redirect('/admin?ok=Rol actualizado');
}

export async function addBreed(fd: FormData) {
  const { supabase } = await requireAdmin();
  const name = clean(fd, 'name');
  if (!name) redirect('/admin?t=catalog&error=El nombre es obligatorio');
  const { error } = await supabase.from('breeds').insert({ name, species: clean(fd, 'species') || 'dog', size: clean(fd, 'size') });
  if (error) redirect(`/admin?t=catalog&error=${enc(friendly(error.message))}`);
  redirect('/admin?t=catalog&ok=Raza agregada');
}

export async function addVaccineType(fd: FormData) {
  const { supabase } = await requireAdmin();
  const name = clean(fd, 'name'), days = clean(fd, 'interval_days');
  if (!name) redirect('/admin?t=catalog&error=El nombre es obligatorio');
  const { error } = await supabase.from('vaccine_types').insert({
    name, description: clean(fd, 'description'), interval_days: days ? Number(days) : null, species: clean(fd, 'species') || 'all',
  });
  if (error) redirect(`/admin?t=catalog&error=${enc(friendly(error.message))}`);
  redirect('/admin?t=catalog&ok=Vacuna agregada al catálogo');
}

export async function toggleCatalog(table: 'breeds' | 'vaccine_types', id: number, active: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from(table).update({ active: !active }).eq('id', id);
  redirect(`/admin?t=catalog&ok=${enc(active ? 'Elemento desactivado' : 'Elemento activado')}`);
}
