import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionProfile, SPECIES, SEX, ageText } from '@/lib/auth'
import { SECTIONS, TABS } from '@/lib/sections'
import SectionCard from '@/components/SectionCard'
import WeightChart from '@/components/WeightChart'
import { deletePet } from '../actions'

export default async function PetPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const tab = sp.tab && TABS[sp.tab] ? sp.tab : 'salud'
  const { supabase, isAdmin } = await getSessionProfile()

  const { data: pet } = await supabase
    .from('pets')
    .select('*, breeds(name), profiles:owner_id(full_name, email)')
    .eq('id', id).is('deleted_at', null).maybeSingle()
  if (!pet) notFound()

  const dynamicOptions: Record<string, { value: string; label: string }[]> = {}
  const keys = TABS[tab].sections
  if (keys.includes('vaccinations')) {
    const { data } = await supabase.from('vaccine_types').select('id, name').eq('active', true).order('name')
    dynamicOptions.vaccine_types = (data ?? []).map((v: any) => ({ value: String(v.id), label: v.name }))
  }

  const rowsByKey: Record<string, any[]> = {}
  for (const k of keys) {
    const s = SECTIONS[k]
    const { data } = await supabase.from(s.table).select(s.select ?? '*').eq('pet_id', id).order(s.order, { ascending: false })
    rowsByKey[k] = (data ?? []) as any[]
  }

  // Historial por año
  let byYear: Record<string, { date: string; kind: string; text: string }[]> = {}
  if (tab === 'historial') {
    const [v, m, w, e] = await Promise.all([
      supabase.from('vaccinations').select('scheduled_date, applied_date, vaccine_types(name)').eq('pet_id', id),
      supabase.from('medical_records').select('visit_date, reason, diagnosis').eq('pet_id', id),
      supabase.from('weight_logs').select('measured_on, weight_kg').eq('pet_id', id),
      supabase.from('exercise_logs').select('performed_on, exercise_type, duration_min').eq('pet_id', id),
    ])
    const ev: { date: string; kind: string; text: string }[] = []
    ;(v.data as any[] ?? []).forEach((r) => ev.push({ date: r.applied_date ?? r.scheduled_date, kind: 'Vacuna', text: `${r.vaccine_types?.name ?? ''}${r.applied_date ? '' : ' (pendiente)'}` }))
    ;(m.data as any[] ?? []).forEach((r) => ev.push({ date: r.visit_date, kind: 'Consulta', text: r.diagnosis || r.reason || 'Consulta' }))
    ;(w.data as any[] ?? []).forEach((r) => ev.push({ date: r.measured_on, kind: 'Peso', text: `${r.weight_kg} kg` }))
    ;(e.data as any[] ?? []).forEach((r) => ev.push({ date: r.performed_on, kind: 'Ejercicio', text: `${r.exercise_type} · ${r.duration_min} min` }))
    ev.sort((a, b) => b.date.localeCompare(a.date))
    ev.forEach((x) => { (byYear[x.date.slice(0, 4)] ||= []).push(x) })
  }

  const breed = pet.breeds?.name ?? pet.breed_other ?? 'Raza sin definir'
  const weightData = (rowsByKey.weight_logs ?? []).slice().reverse().map((r) => ({ date: r.measured_on, kg: Number(r.weight_kg) }))

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{pet.name}</h1>
          <p className="text-sm text-pine-700">
            {SPECIES[pet.species]} · {breed} · {SEX[pet.sex]} · {ageText(pet.birth_date)}
          </p>
          <p className="mt-1 text-xs text-pine-700">
            {[pet.birth_date && `Nació el ${pet.birth_date}`, pet.birth_place, pet.microchip && `Microchip ${pet.microchip}`, pet.origin_type && `Procedencia: ${pet.origin_type}`].filter(Boolean).join(' · ')}
          </p>
          {isAdmin && pet.profiles && <p className="mt-1 text-xs text-pine-700">Dueño: {pet.profiles.full_name} ({pet.profiles.email})</p>}
          {pet.notes && <p className="mt-2 text-sm">{pet.notes}</p>}
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/pets/${id}/export`} className="btn-ghost">Exportar historial (CSV)</a>
          <form action={deletePet}>
            <input type="hidden" name="pet_id" value={id} />
            <button className="btn-danger">Eliminar mascota</button>
          </form>
        </div>
      </div>

      {sp.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-brick-600">{sp.error}</p>}

      <nav className="flex gap-1 overflow-x-auto border-b border-pine-100" aria-label="Secciones">
        {Object.entries(TABS).map(([k, t]) => (
          <Link key={k} href={`/pets/${id}?tab=${k}`}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${k === tab ? 'border-pine-700 font-semibold text-pine-700' : 'border-transparent text-pine-600 hover:text-pine-900'}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'crecimiento' && (
        <div className="card"><h2 className="mb-2 font-semibold">Evolución del peso</h2><WeightChart data={weightData} /></div>
      )}

      {tab === 'historial' ? (
        Object.keys(byYear).length === 0 ? <p className="text-sm text-pine-700">Aún no hay eventos para mostrar.</p> :
        Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0])).map(([year, items]) => (
          <section key={year} className="card">
            <h2 className="mb-2 text-lg font-semibold">{year}</h2>
            <ul className="divide-y divide-pine-50 text-sm">
              {items.map((x, i) => (
                <li key={i} className="flex gap-3 py-1.5"><span className="w-24 shrink-0 text-pine-700">{x.date}</span><span className="w-20 shrink-0 font-medium">{x.kind}</span><span>{x.text}</span></li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        keys.map((k) => (
          <SectionCard key={k} petId={id} tab={tab} section={SECTIONS[k]} rows={rowsByKey[k]}
            canWrite={!SECTIONS[k].adminOnly || isAdmin} dynamicOptions={dynamicOptions} />
        ))
      )}
    </div>
  )
}
