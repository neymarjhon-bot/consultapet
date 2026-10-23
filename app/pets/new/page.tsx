import { getSessionProfile } from '@/lib/auth'
import { createPet } from '../actions'

export default async function NewPet({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams
  const { supabase, isAdmin } = await getSessionProfile()
  const { data: breeds } = await supabase.from('breeds').select('id, name, species').eq('active', true).order('name')
  const { data: owners } = isAdmin ? await supabase.from('profiles').select('id, full_name, email').order('full_name') : { data: [] as any[] }

  return (
    <form action={createPet} className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Agregar mascota</h1>
      {sp.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-brick-600">{sp.error}</p>}
      {isAdmin && (
        <div>
          <label className="label" htmlFor="owner_id">Dueño</label>
          <select id="owner_id" name="owner_id" className="input">
            <option value="">Yo mismo</option>
            {(owners ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.full_name || o.email}</option>)}
          </select>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="name">Nombre *</label><input id="name" name="name" required className="input" /></div>
        <div>
          <label className="label" htmlFor="species">Especie</label>
          <select id="species" name="species" className="input"><option value="dog">Perro</option><option value="cat">Gato</option><option value="other">Otro</option></select>
        </div>
        <div>
          <label className="label" htmlFor="breed_id">Raza</label>
          <select id="breed_id" name="breed_id" className="input">
            <option value="">Otra / no sé</option>
            {(breeds ?? []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="breed_other">Si es otra raza, escríbela</label><input id="breed_other" name="breed_other" className="input" /></div>
        <div>
          <label className="label" htmlFor="sex">Sexo</label>
          <select id="sex" name="sex" className="input"><option value="unknown">Sin definir</option><option value="male">Macho</option><option value="female">Hembra</option></select>
        </div>
        <div><label className="label" htmlFor="birth_date">Fecha de nacimiento</label><input id="birth_date" name="birth_date" type="date" className="input" /></div>
        <div><label className="label" htmlFor="birth_place">Lugar de nacimiento</label><input id="birth_place" name="birth_place" className="input" /></div>
        <div><label className="label" htmlFor="color">Color</label><input id="color" name="color" className="input" /></div>
        <div><label className="label" htmlFor="microchip">Microchip</label><input id="microchip" name="microchip" className="input" /></div>
        <div>
          <label className="label" htmlFor="origin_type">Procedencia</label>
          <select id="origin_type" name="origin_type" className="input">
            <option value="">—</option><option value="criadero">Criadero</option><option value="adopcion">Adopción</option><option value="particular">Particular</option><option value="otro">Otro</option>
          </select>
        </div>
      </div>
      <div><label className="label" htmlFor="notes">Notas (criadero, padres, observaciones)</label><textarea id="notes" name="notes" rows={3} className="input" /></div>
      <button className="btn">Guardar mascota</button>
    </form>
  )
}
