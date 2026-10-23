import { SECTIONS } from '@/lib/sections'

export type HistorySection = { title: string; headers: string[]; rows: string[][] }

export async function loadHistory(supabase: any, petId: string) {
  const { data: pet } = await supabase
    .from('pets')
    .select('*, breeds(name), profiles:owner_id(full_name, email)')
    .eq('id', petId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!pet) return null

  const sections: HistorySection[] = []
  for (const s of Object.values(SECTIONS)) {
    const { data } = await supabase
      .from(s.table)
      .select(s.select ?? '*')
      .eq('pet_id', petId)
      .order(s.order, { ascending: false })
    sections.push({
      title: s.title,
      headers: s.cols.map((c) => c.label),
      rows: ((data ?? []) as any[]).map((r) => s.cols.map((c) => String(c.get(r) ?? ''))),
    })
  }
  const info: [string, string][] = [
    ['Nombre', pet.name],
    ['Raza', pet.breeds?.name ?? pet.breed_other ?? '—'],
    ['Sexo', ({ male: 'Macho', female: 'Hembra', unknown: 'Sin definir' } as any)[pet.sex] ?? ''],
    ['Nacimiento', pet.birth_date ?? '—'],
    ['Lugar de nacimiento', pet.birth_place ?? '—'],
    ['Microchip', pet.microchip ?? '—'],
    ['Dueño', pet.profiles ? `${pet.profiles.full_name} (${pet.profiles.email})` : '—'],
  ]
  return { pet, info, sections }
}

export const safeName = (s: string) => s.replace(/[^\w\-]+/g, '_')
