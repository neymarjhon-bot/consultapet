import { requireProfile } from '@/lib/auth';
import { createPet } from '@/app/actions';
import Flash from '@/components/Flash';

export default async function NewPet({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { supabase, isAdmin } = await requireProfile();
  const [{ data: breeds }, { data: owners }] = await Promise.all([
    supabase.from('breeds').select('id,name,species').eq('active', true).order('name'),
    isAdmin ? supabase.from('profiles').select('id,full_name,email').order('full_name') : Promise.resolve({ data: [] as any[] }),
  ]);
  return (
    <>
      <div className="head"><div><h1>Registrar mascota</h1><p className="sub">Solo el nombre es obligatorio; puedes completar el resto después.</p></div></div>
      <Flash error={sp.error} />
      <form action={createPet} className="card f">
        {isAdmin && (
          <label className="wide">Dueño
            <select name="owner_id" required>{owners!.map((o: any) => <option key={o.id} value={o.id}>{o.full_name || o.email}</option>)}</select>
          </label>
        )}
        <label>Nombre<input name="name" required /></label>
        <label>Especie<select name="species" defaultValue="dog"><option value="dog">Perro</option><option value="cat">Gato</option><option value="other">Otro</option></select></label>
        <label>Raza
          <select name="breed_id" defaultValue=""><option value="">Sin especificar</option>
            {breeds?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        </label>
        <label>Otra raza / mestizo<input name="breed_other" placeholder="Si no está en la lista" /></label>
        <label>Sexo<select name="sex" defaultValue="unknown"><option value="male">Macho</option><option value="female">Hembra</option><option value="unknown">Sin definir</option></select></label>
        <label>Fecha de nacimiento<input name="birth_date" type="date" /></label>
        <label>Lugar de nacimiento<input name="birth_place" /></label>
        <label>Color<input name="color" /></label>
        <label>Microchip<input name="microchip" /></label>
        <label>Procedencia<input name="origin_type" placeholder="Criadero, adopción, regalo…" /></label>
        <label className="wide">Notas (padres, criadero, observaciones)<textarea name="notes" /></label>
        <div className="wide"><button className="btn">Guardar mascota</button></div>
      </form>
    </>
  );
}
