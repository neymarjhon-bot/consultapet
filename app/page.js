import { getSession } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { sb, profile } = await getSession();
  const staff = profile.role === 'admin';
  const { data: pets } = await sb
    .from('pets')
    .select('id,name,species,sex,birth_date,photo_path,owner_id,breeds(name),profiles:owner_id(full_name,email)')
    .is('deleted_at', null)
    .order('name');
  const limit = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const { data: due } = await sb
    .from('vaccinations')
    .select('id,pet_id')
    .is('applied_date', null)
    .lte('scheduled_date', limit)
    .limit(200);

  return (
    <>
      <h1>{staff ? 'Todas las mascotas' : 'Mis mascotas'}</h1>
      {!pets?.length && <p className="mut">Aún no hay mascotas. {profile.role === 'owner' && <a href="/pets/new">Agrega la primera</a>}</p>}
      <div className="grid">
        {pets?.map((p) => (
          <a key={p.id} href={`/pets/${p.id}`} className="card">
            <h3>{p.species === 'cat' ? '🐱' : '🐶'} {p.name}</h3>
            <div className="mut">{p.breeds?.name || '—'} · {p.sex}</div>
            <div className="mut">Nac.: {p.birth_date || '—'}</div>
            {staff && <div className="mut">Dueño: {p.profiles?.full_name || p.profiles?.email}</div>}
            {due?.filter((d) => d.pet_id === p.id).length > 0 && (
              <span className="badge b-late">{due.filter((d) => d.pet_id === p.id).length} vacuna(s) por atender</span>
            )}
          </a>
        ))}
      </div>
    </>
  );
}
