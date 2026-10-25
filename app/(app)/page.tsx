import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { addDays, ageText, fmtDate, SPECIES, today } from '@/lib/format';
import Flash from '@/components/Flash';

export default async function Home({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; q?: string }> }) {
  const sp = await searchParams;
  const { supabase, profile, isAdmin } = await requireProfile();
  const [{ data: pets }, { data: pending }] = await Promise.all([
    supabase.from('pets').select('id,name,species,sex,birth_date,breed_other,breeds(name),owner:owner_id(full_name,email)').is('deleted_at', null).order('name'),
    supabase.from('vaccinations').select('id,pet_id,scheduled_date,pets(name),vaccine_types(name)').is('applied_date', null).order('scheduled_date').limit(100),
  ]);
  const t = today(), soon = addDays(30);
  const overdue = (pending ?? []).filter((v: any) => v.scheduled_date < t);
  const upcoming = (pending ?? []).filter((v: any) => v.scheduled_date >= t && v.scheduled_date <= soon);
  const q = (sp.q ?? '').toLowerCase();
  const list = (pets ?? []).filter((p: any) => !q || p.name.toLowerCase().includes(q) || (p.owner?.full_name ?? '').toLowerCase().includes(q));

  return (
    <>
      <div className="head">
        <div>
          <h1>{isAdmin ? 'Todas las mascotas' : `Hola, ${profile.full_name?.split(' ')[0] || 'bienvenido'}`}</h1>
          <p className="sub">{isAdmin ? 'Vista veterinaria de todos los pacientes.' : 'Estas son tus mascotas y lo que necesita atención.'}</p>
        </div>
        <Link className="btn" href="/pets/new">Registrar mascota</Link>
      </div>
      <Flash error={sp.error} ok={sp.ok} />

      <div className="stats">
        <div className="stat"><b>{pets?.length ?? 0}</b>Mascotas</div>
        <div className="stat"><b style={{ color: overdue.length ? 'var(--alert)' : undefined }}>{overdue.length}</b>Vacunas vencidas</div>
        <div className="stat"><b>{upcoming.length}</b>Vacunas en 30 días</div>
      </div>

      {(overdue.length > 0 || upcoming.length > 0) && (
        <section className="card" aria-label="Alertas de vacunas">
          <h2>Alertas de vacunas</h2>
          <div className="scroll"><table>
            <thead><tr><th>Mascota</th><th>Vacuna</th><th>Fecha</th><th>Estado</th></tr></thead>
            <tbody>
              {[...overdue, ...upcoming].slice(0, 12).map((v: any) => (
                <tr key={v.id}>
                  <td><Link href={`/pets/${v.pet_id}?tab=vacunas`}>{v.pets?.name}</Link></td>
                  <td>{v.vaccine_types?.name}</td><td>{fmtDate(v.scheduled_date)}</td>
                  <td>{v.scheduled_date < t ? <span className="badge b-over">Vencida</span> : <span className="badge b-soon">Próxima</span>}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
      )}

      {isAdmin && (
        <form className="noprint" style={{ margin: '0 0 1rem' }}>
          <input name="q" defaultValue={sp.q} placeholder="Buscar por mascota o dueño…" aria-label="Buscar" style={{ maxWidth: 360 }} />
        </form>
      )}

      {list.length === 0 ? (
        <div className="card"><h3>Aún no hay mascotas</h3><p className="sub">Registra la primera para empezar su historial.</p><Link className="btn" href="/pets/new">Registrar mascota</Link></div>
      ) : (
        <div className="grid">
          {list.map((p: any) => (
            <Link key={p.id} href={`/pets/${p.id}`} className="pet">
              <b>{p.name}</b>
              <p className="sub">{SPECIES[p.species]} · {p.breeds?.name ?? p.breed_other ?? 'Mestizo'}</p>
              <p>{ageText(p.birth_date)}</p>
              {isAdmin && <p className="sub">Dueño: {p.owner?.full_name || p.owner?.email}</p>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
