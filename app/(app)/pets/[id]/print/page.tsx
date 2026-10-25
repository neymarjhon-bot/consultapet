import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { SECTIONS } from '@/lib/sections';
import { ageText, fmtDate, SEX, SPECIES } from '@/lib/format';
import SectionView from '@/components/SectionView';
import PrintButton from '@/components/PrintButton';
import WeightChart from '@/components/WeightChart';

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireProfile();
  const { data: pet } = await supabase.from('pets').select('*, breeds(name), owner:owner_id(full_name,email)').eq('id', id).maybeSingle();
  if (!pet) notFound();
  const keys = Object.keys(SECTIONS);
  const data = await Promise.all(keys.map((k) => supabase.from(SECTIONS[k].table).select(SECTIONS[k].select ?? '*').eq('pet_id', id).order(SECTIONS[k].order, { ascending: false }).then((r: any) => r.data ?? [])));
  return (
    <>
      <div className="head noprint"><Link href={`/pets/${id}`}>← Volver</Link><PrintButton /></div>
      <h1>Historial de {pet.name}</h1>
      <p className="sub">{SPECIES[pet.species]} · {pet.breeds?.name ?? pet.breed_other ?? 'Mestizo'} · {SEX[pet.sex]} · {ageText(pet.birth_date)} · Nacimiento {fmtDate(pet.birth_date)} · Dueño {pet.owner?.full_name || pet.owner?.email}</p>
      <p className="sub">Generado el {fmtDate(new Date().toISOString().slice(0, 10))}</p>
      <div style={{ marginTop: '1rem' }}>
        {keys.map((k, i) => (
          <div key={k}>
            {k === 'weight_logs' && <section className="card"><h2>Curva de peso</h2><WeightChart data={data[i]} /></section>}
            <SectionView s={SECTIONS[k]} rows={data[i]} petId={id} canWrite={false} readOnlyView />
          </div>
        ))}
      </div>
    </>
  );
}
