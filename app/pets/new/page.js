import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';

async function createPet(fd) {
  'use server';
  const { sb, user, profile } = await getSession();
  if (profile?.role !== 'owner') redirect('/');
  const v = (k) => fd.get(k) || null;
  const { data, error } = await sb.from('pets').insert({
    owner_id: user.id,
    name: v('name'),
    species: v('species') || 'dog',
    breed_id: v('breed_id') ? Number(v('breed_id')) : null,
    breed_other: v('breed_other'),
    sex: v('sex') || 'unknown',
    birth_date: v('birth_date'),
    birth_place: v('birth_place'),
    origin_type: v('origin_type'),
    microchip: v('microchip'),
    color: v('color'),
    notes: v('notes'),
  }).select('id').single();
  if (error) throw new Error(error.message);
  redirect(`/pets/${data.id}`);
}

export default async function NewPet() {
  const { sb } = await getSession();
  const { data: breeds } = await sb.from('breeds').select('id,name,species').eq('active', true).order('name');
  return (
    <div className="card">
      <h1>Nueva mascota</h1>
      <form action={createPet} className="row">
        <div><label>Nombre *</label><input name="name" required /></div>
        <div><label>Especie</label><select name="species"><option value="dog">Perro</option><option value="cat">Gato</option></select></div>
        <div><label>Raza</label>
          <select name="breed_id"><option value="">— otra —</option>
            {breeds?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
        <div><label>Otra raza</label><input name="breed_other" /></div>
        <div><label>Sexo</label><select name="sex"><option value="male">Macho</option><option value="female">Hembra</option><option value="unknown">Desconocido</option></select></div>
        <div><label>Fecha de nacimiento</label><input type="date" name="birth_date" /></div>
        <div><label>Lugar de nacimiento</label><input name="birth_place" /></div>
        <div><label>Origen (criadero, adopción…)</label><input name="origin_type" /></div>
        <div><label>Microchip</label><input name="microchip" /></div>
        <div><label>Color</label><input name="color" /></div>
        <div style={{ gridColumn: '1/-1' }}><label>Notas (padres, procedencia…)</label><textarea name="notes" rows={2} /></div>
        <button>Guardar</button>
      </form>
    </div>
  );
}
