'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SECTIONS } from '@/lib/sections'

const clean = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '')

export async function createPet(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const name = clean(formData.get('name'))
  if (!name) redirect('/pets/new?error=' + encodeURIComponent('El nombre es obligatorio.'))
  const breed = clean(formData.get('breed_id'))
  const row: Record<string, any> = {
    owner_id: clean(formData.get('owner_id')) || user.id,
    name,
    species: clean(formData.get('species')) || 'dog',
    sex: clean(formData.get('sex')) || 'unknown',
    breed_id: breed ? Number(breed) : null,
    breed_other: clean(formData.get('breed_other')) || null,
    birth_date: clean(formData.get('birth_date')) || null,
    birth_place: clean(formData.get('birth_place')) || null,
    color: clean(formData.get('color')) || null,
    microchip: clean(formData.get('microchip')) || null,
    origin_type: clean(formData.get('origin_type')) || null,
    notes: clean(formData.get('notes')) || null,
  }
  const { data, error } = await supabase.from('pets').insert(row).select('id').single()
  if (error) redirect('/pets/new?error=' + encodeURIComponent(error.message))
  revalidatePath('/')
  redirect(`/pets/${data.id}`)
}

export async function deletePet(formData: FormData) {
  const supabase = await createClient()
  const id = clean(formData.get('pet_id'))
  const { error } = await supabase.from('pets').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) redirect(`/pets/${id}?error=` + encodeURIComponent(error.message))
  revalidatePath('/')
  redirect('/')
}

export async function addRecord(formData: FormData) {
  const supabase = await createClient()
  const petId = clean(formData.get('pet_id'))
  const tab = clean(formData.get('tab')) || 'salud'
  const section = SECTIONS[clean(formData.get('section'))]
  const back = `/pets/${petId}?tab=${tab}`
  if (!section) redirect(back + '&error=' + encodeURIComponent('Sección inválida.'))
  const row: Record<string, any> = { pet_id: petId }
  for (const f of section.fields) {
    const v = clean(formData.get(f.name))
    if (!v) {
      if (f.required) redirect(back + '&error=' + encodeURIComponent(`Falta el campo: ${f.label}.`))
      continue
    }
    row[f.name] = f.type === 'number' || f.optionsFrom ? Number(v) : v
  }
  const { error } = await supabase.from(section.table).insert(row)
  if (error) redirect(back + '&error=' + encodeURIComponent(error.message))
  revalidatePath(`/pets/${petId}`)
  redirect(back)
}

export async function deleteRecord(formData: FormData) {
  const supabase = await createClient()
  const petId = clean(formData.get('pet_id'))
  const tab = clean(formData.get('tab')) || 'salud'
  const section = SECTIONS[clean(formData.get('section'))]
  const back = `/pets/${petId}?tab=${tab}`
  if (!section) redirect(back)
  const { error } = await supabase.from(section.table).delete().eq('id', clean(formData.get('id')))
  if (error) redirect(back + '&error=' + encodeURIComponent(error.message))
  revalidatePath(`/pets/${petId}`)
  redirect(back)
}
