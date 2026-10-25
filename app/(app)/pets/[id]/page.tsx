import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import { SECTIONS, TABS } from '@/lib/sections';
import { ageText, fmtDate, SEX, SPECIES } from '@/lib/format';
import { archivePet } from '@/app/actions';
import Flash from '@/components/Flash';
import SectionView from '@/components/SectionView';
import WeightChart from '@/components/WeightChart';
import WeeklyBars from '@/components/WeeklyBars';

export default async function PetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; ok?: string; error?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  const { supabase, isAdmin } = await requireProfile();
  const { data: pet } = await supabase.from('pets').select('*, breeds(name), owner:owner_id(full_name,email,phone)').eq('id', id).is('deleted_at', null).maybeSingle();
  if (!pet) notFound();
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];
  const secs = tab.sections.map((k) => SECTIONS[k]);
  const [data, vt, summary] = await Promise.all([
    Promise.all(secs.map((s) => supabase.from(s.table).select(s.select ?? '*').eq('pet_id', id).order(s.order, { ascending: false }).then((r: any) => r.data ?? []))),
    tab.key === 'vacunas' ? supabase.from('vaccine_types').select('id,name').eq('active', true).order('name').then((r: any) => r.data ?? []) : Promise.resolve([]),
    tab.key === 'resumen' ? Promise.all([
      supabase.from('weight_logs').select('measured_on,weight_kg').eq('pet_id', id).order('measured_on', { ascending: false }).limit(1),
      supabase.from('allergies').select('allergen').eq('pet_id', id),
      supabase.from('vaccinations').select('scheduled_date,vaccine_types(name)').eq('pet_id', id).is('applied_date', null).order('scheduled_date').limit(1),
    ]) : Promise.resolve(null),
  ]);

  return (
    <>
      <div className="head">
        <div>
          <p className="sub"><Link href="/">← Mascotas</Link></p>
          <h1>{pet.name}</h1>
          <p className="sub">{SPECIES[pet.species]} · {pet.breeds?.name ?? pet.breed_other ?? 'Mestizo'} · {SEX[pet.sex]} · {ageText(pet.birth_date)}</p>
        </div>
        <div className="noprint" style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <Link className="btn ghost" href={`/pets/${id}/print`}>Ver historial completo</Link>
          <a className="btn ghost" href={`/pets/${id}/export`}>Exportar Excel (CSV)</a>
        </div>
      </div>
      <Flash error={sp.error} ok={sp.ok} />
      <nav className="tabs" aria-label="Secciones">
        {TABS.map((t) => <Link key={t.key} href={`/pets/${id}?tab=${t.key}`} className={t.key === tab.key ? 'on' : ''}>{t.label}</Link>)}
      </nav>

      {tab.key === 'resumen' && (
        <>
          <section className="card"><h2>Datos básicos</h2>
            <div className="kv" style={{ marginTop: '.7rem' }}>
              <div><small>Nacimiento</small><span>{fmtDate(pet.birth_date)}</span></div>
              <div><small>Lugar</small><span>{pet.birth_place ?? '—'}</span></div>
              <div><small>Color</small><span>{pet.color ?? '—'}</span></div>
              <div><small>Microchip</small><span>{pet.microchip ?? '—'}</span></div>
              <div><small>Procedencia</small><span>{pet.origin_type ?? '—'}</span></div>
              <div><small>Dueño</small><span>{pet.owner?.full_name || pet.owner?.email}</span></div>
              {isAdmin && <div><small>Contacto</small><span>{pet.owner?.phone ?? '—'}</span></div>}
            </div>
            {pet.notes && <p style={{ marginTop: '.8rem' }}>{pet.notes}</p>}
          </section>
          <section className="card"><h2>Estado actual</h2>
            <div className="kv" style={{ marginTop: '.7rem' }}>
              <div><small>Último peso</small><span>{(summary as any)[0].data?.[0] ? `${(summary as any)[0].data[0].weight_kg} kg (${fmtDate((summary as any)[0].data[0].measured_on)})` : 'Sin registros'}</span></div>
              <div><small>Alergias</small><span>{(summary as any)[1].data?.length ? (summary as any)[1].data.map((a: any) => a.allergen).join(', ') : 'Ninguna registrada'}</span></div>
              <div><small>Próxima vacuna</small><span>{(summary as any)[2].data?.[0] ? `${(summary as any)[2].data[0].vaccine_types?.name} · ${fmtDate((summary as any)[2].data[0].scheduled_date)}` : 'Sin pendientes'}</span></div>
            </div>
          </section>
          <form action={archivePet.bind(null, id)} className="noprint"><button className="btn danger sm">Archivar mascota</button></form>
        </>
      )}

      {tab.key === 'peso' && <section className="card"><h2>Curva de peso</h2><WeightChart data={data[0]} /></section>}
      {tab.key === 'ejercicio' && <WeeklyBars rows={data[0]} />}

      {secs.map((s, i) => (
        <SectionView key={s.key} s={s} rows={data[i]} petId={id} canWrite={!s.adminOnly || isAdmin} vaccineTypes={vt as any[]} />
      ))}
    </>
  );
}
