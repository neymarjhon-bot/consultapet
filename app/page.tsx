import Link from 'next/link'
import { getSessionProfile, SPECIES, ageText } from '@/lib/auth'

export default async function Home() {
  const { supabase, isAdmin, profile } = await getSessionProfile()
  const limit = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name, species, sex, birth_date, breed_other, breeds(name), profiles:owner_id(full_name)')
    .is('deleted_at', null)
    .order('name')

  const { data: alerts } = await supabase
    .from('vaccinations')
    .select('id, scheduled_date, pet_id, pets!inner(name, deleted_at), vaccine_types(name)')
    .is('applied_date', null)
    .is('pets.deleted_at', null)
    .lte('scheduled_date', limit)
    .order('scheduled_date')

  const today = new Date().toISOString().slice(0, 10)
  const list = (pets ?? []) as any[]
  const al = (alerts ?? []) as any[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{isAdmin ? 'Todas las mascotas' : `Hola, ${profile?.full_name?.split(' ')[0] || 'bienvenido'}`}</h1>
          <p className="text-sm text-pine-700">{list.length} {list.length === 1 ? 'mascota registrada' : 'mascotas registradas'}</p>
        </div>
        <Link href="/pets/new" className="btn">Agregar mascota</Link>
      </div>

      {al.length > 0 && (
        <section className="card border-amber-600/40">
          <h2 className="mb-2 font-semibold">Vacunas por atender</h2>
          <ul className="divide-y divide-pine-100 text-sm">
            {al.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <Link href={`/pets/${a.pet_id}?tab=salud`} className="hover:underline">
                  <strong>{a.pets?.name}</strong> · {a.vaccine_types?.name}
                </Link>
                <span className={a.scheduled_date < today ? 'font-medium text-brick-600' : 'text-amber-600'}>
                  {a.scheduled_date < today ? 'Vencida' : 'Próxima'} · {a.scheduled_date}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {list.length === 0 ? (
        <div className="card text-center">
          <p className="mb-3 text-sm">Aún no hay mascotas. Agrega la primera para empezar su historial.</p>
          <Link href="/pets/new" className="btn">Agregar mascota</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Link key={p.id} href={`/pets/${p.id}`} className="card block hover:border-pine-600">
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="text-sm text-pine-700">
                {SPECIES[p.species] ?? p.species} · {p.breeds?.name ?? p.breed_other ?? 'Raza sin definir'}
              </div>
              <div className="mt-1 text-xs text-pine-700">{ageText(p.birth_date)}{isAdmin && p.profiles?.full_name ? ` · Dueño: ${p.profiles.full_name}` : ''}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
