'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import PetAvatar from '@/components/PetAvatar';
import PetForm from '@/components/PetForm';
import CrudSection from '@/components/CrudSection';
import ShareVet from '@/components/ShareVet';
import WeightChart from '@/components/WeightChart';
import Timeline from '@/components/Timeline';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { exportPetXlsx } from '@/lib/export';
import { age, fmtDate, today, STATUS } from '@/lib/utils';

const TABS = [['resumen', 'Resumen'], ['vacunas', 'Vacunas'], ['salud', 'Salud'], ['alimentacion', 'Alimentación'], ['peso', 'Peso'], ['ejercicio', 'Ejercicio'], ['historial', 'Línea de tiempo']];
const SPECIES = { dog: 'Perro', cat: 'Gato', other: 'Otro' };
const SEX = { male: 'Macho', female: 'Hembra', unknown: 'No indicado' };
const INTENSITY = [['low', 'Baja'], ['medium', 'Media'], ['high', 'Alta']];
const STAGE = [['puppy', 'Cachorro'], ['adult', 'Adulto'], ['senior', 'Senior']];

function PetPage() {
  const { id } = useParams();
  const router = useRouter();
  const { session, profile } = useAuth();
  const [pet, setPet] = useState(undefined);
  const [tab, setTab] = useState('resumen');
  const [editing, setEditing] = useState(false);
  const [tick, setTick] = useState(0);
  const [summary, setSummary] = useState({ weight: null, vaccines: [] });
  const bump = () => setTick((t) => t + 1);

  const load = useCallback(async () => {
    const { data } = await supabase.from('pets').select('*, breeds(name)').eq('id', id).maybeSingle();
    setPet(data || null);
    const [w, v] = await Promise.all([
      supabase.from('weight_logs').select('weight_kg,measured_on').eq('pet_id', id).order('measured_on', { ascending: false }).limit(1),
      supabase.from('vaccination_status').select('*').eq('pet_id', id).is('applied_date', null).order('scheduled_date').limit(5)
    ]);
    setSummary({ weight: w.data?.[0] || null, vaccines: v.data || [] });
  }, [id]);
  useEffect(() => { load(); }, [load, tick]);

  if (pet === undefined) return <p className="text-stone-500">Cargando…</p>;
  if (pet === null || pet.deleted_at) return <div className="card">Mascota no encontrada o sin acceso.</div>;

  const isOwner = pet.owner_id === session.user.id || profile.role === 'admin';
  const healthWrite = isOwner || profile.role === 'vet';

  async function archive() {
    if (!confirm(`¿Dar de baja a ${pet.name}? Podrás pedir a un administrador recuperarla.`)) return;
    await supabase.from('pets').update({ deleted_at: new Date().toISOString() }).eq('id', pet.id);
    router.replace('/dashboard');
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <PetAvatar path={pet.photo_path} size={72} species={pet.species} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{pet.name}</h1>
          <p className="text-sm text-stone-500">{SPECIES[pet.species]} · {pet.breeds?.name || pet.breed_other || 'Sin raza'} · {SEX[pet.sex]} · {age(pet.birth_date)}</p>
        </div>
        <div className="no-print flex gap-2">
          <button className="btn-ghost" onClick={() => exportPetXlsx(pet)}>⬇ Excel</button>
          <button className="btn-ghost" onClick={() => { setTab('historial'); setTimeout(() => window.print(), 400); }}>🖨 PDF</button>
        </div>
      </div>

      <div className="no-print mb-4 flex gap-1 overflow-x-auto border-b border-stone-200">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`whitespace-nowrap px-3 py-2 text-sm ${tab === k ? 'border-b-2 border-brand-600 font-medium text-brand-700' : 'text-stone-500 hover:text-stone-800'}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-4">
        {tab === 'resumen' && (editing ? <PetForm pet={pet} /> : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="card text-sm">
                <h3 className="mb-2 font-semibold">Datos básicos</h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <dt className="text-stone-500">Nacimiento</dt><dd>{fmtDate(pet.birth_date)} {pet.birth_place && `· ${pet.birth_place}`}</dd>
                  <dt className="text-stone-500">Microchip</dt><dd>{pet.microchip || '—'}</dd>
                  <dt className="text-stone-500">Color</dt><dd>{pet.color || '—'}</dd>
                  <dt className="text-stone-500">Peso actual</dt><dd>{summary.weight ? `${summary.weight.weight_kg} kg (${fmtDate(summary.weight.measured_on)})` : '—'}</dd>
                </dl>
              </section>
              <section className="card text-sm">
                <h3 className="mb-2 font-semibold">Origen y padres</h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <dt className="text-stone-500">Origen</dt><dd>{pet.origin_type || '—'}</dd>
                  <dt className="text-stone-500">Procedencia</dt><dd>{[pet.breeder_name, pet.origin_place].filter(Boolean).join(' · ') || '—'}</dd>
                  <dt className="text-stone-500">Padre</dt><dd>{[pet.sire_name, pet.sire_breed].filter(Boolean).join(' · ') || '—'}</dd>
                  <dt className="text-stone-500">Madre</dt><dd>{[pet.dam_name, pet.dam_breed].filter(Boolean).join(' · ') || '—'}</dd>
                </dl>
                {pet.notes && <p className="mt-2 text-stone-600">{pet.notes}</p>}
              </section>
            </div>
            <section className="card text-sm">
              <h3 className="mb-2 font-semibold">Próximas vacunas</h3>
              {summary.vaccines.length === 0 ? <p className="text-stone-500">Sin vacunas pendientes.</p> : (
                <ul className="space-y-1">
                  {summary.vaccines.map((v) => (
                    <li key={v.id}><span className={`badge mr-2 ${STATUS[v.status].cls}`}>{STATUS[v.status].label}</span>{v.vaccine_name} – {fmtDate(v.scheduled_date)}</li>
                  ))}
                </ul>
              )}
            </section>
            {isOwner && <ShareVet petId={pet.id} />}
            {isOwner && (
              <div className="no-print flex gap-3">
                <button className="btn-ghost" onClick={() => setEditing(true)}>✏️ Editar datos</button>
                <button className="btn-ghost text-red-700" onClick={archive}>Dar de baja</button>
              </div>
            )}
          </>
        ))}

        {tab === 'vacunas' && (
          <CrudSection title="Calendario de vacunas" table="vaccinations" readFrom="vaccination_status" petId={pet.id}
            canWrite={healthWrite} order={{ col: 'scheduled_date', asc: false }} onChange={bump}
            fields={[
              { key: 'vaccine_type_id', label: 'Vacuna', required: true, from: { table: 'vaccine_types', value: 'id', label: 'name', in: ['species', [pet.species === 'cat' ? 'cat' : 'dog', 'all']] } },
              { key: 'scheduled_date', label: 'Fecha programada', type: 'date', required: true },
              { key: 'applied_date', label: 'Fecha aplicada', type: 'date' },
              { key: 'vet_name_text', label: 'Veterinario' },
              { key: 'batch_number', label: 'Lote' },
              { key: 'observations', label: 'Observaciones', type: 'textarea' }
            ]}
            extraCols={[{ label: 'Estado', render: (r) => <span className={`badge ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span> }]}
            rowActions={[{
              label: 'Marcar aplicada hoy', show: (r) => !r.applied_date,
              run: (r) => supabase.from('vaccinations').update({ applied_date: today(), ...(profile.role === 'vet' ? { vet_id: session.user.id, vet_name_text: profile.full_name } : {}) }).eq('id', r.id)
            }]} />
        )}

        {tab === 'salud' && (
          <>
            <CrudSection title="Consultas y diagnósticos" table="medical_records" petId={pet.id} canWrite={healthWrite} order={{ col: 'visit_date' }} 
              fields={[
                { key: 'visit_date', label: 'Fecha', type: 'date', required: true }, { key: 'clinic', label: 'Clínica' },
                { key: 'reason', label: 'Motivo' }, { key: 'diagnosis', label: 'Diagnóstico' },
                { key: 'treatment', label: 'Tratamiento' }, { key: 'notes', label: 'Notas', type: 'textarea', hide: true }
              ]} />
            <CrudSection title="Medicamentos" table="medications" petId={pet.id} canWrite={healthWrite}
              fields={[
                { key: 'name', label: 'Medicamento', required: true }, { key: 'dose', label: 'Dosis' }, { key: 'frequency', label: 'Frecuencia' },
                { key: 'start_date', label: 'Inicio', type: 'date' }, { key: 'end_date', label: 'Término', type: 'date' }
              ]} />
            <CrudSection title="Alergias" table="allergies" petId={pet.id} canWrite={healthWrite}
              fields={[
                { key: 'allergen', label: 'Alérgeno', required: true }, { key: 'reaction', label: 'Reacción' },
                { key: 'severity', label: 'Gravedad', options: [['leve', 'Leve'], ['moderada', 'Moderada'], ['grave', 'Grave']] },
                { key: 'detected_on', label: 'Detectada', type: 'date' }
              ]} />
          </>
        )}

        {tab === 'alimentacion' && (
          <>
            <CrudSection title="Plan de alimentación por etapa" table="feeding_plans" petId={pet.id} canWrite={isOwner}
              fields={[
                { key: 'stage', label: 'Etapa', required: true, options: STAGE }, { key: 'food_type', label: 'Tipo (seco, húmedo, BARF…)' },
                { key: 'brand', label: 'Marca' }, { key: 'daily_grams', label: 'Gramos al día', type: 'number', step: '0.1' },
                { key: 'meals_per_day', label: 'Comidas al día', type: 'number' }, { key: 'schedule', label: 'Horarios (08:00, 19:00)' },
                { key: 'start_date', label: 'Desde', type: 'date' }, { key: 'end_date', label: 'Hasta', type: 'date' }
              ]} />
            <CrudSection title="Favoritos y restricciones" table="food_preferences" petId={pet.id} canWrite={isOwner}
              fields={[
                { key: 'kind', label: 'Tipo', required: true, options: [['favorite', '❤️ Favorita'], ['restriction', '🚫 Restricción']] },
                { key: 'description', label: 'Descripción', required: true }
              ]} />
            <CrudSection title="Registro de comidas" table="meal_logs" petId={pet.id} canWrite={isOwner} order={{ col: 'fed_at' }}
              fields={[
                { key: 'fed_at', label: 'Fecha y hora', type: 'datetime', required: true }, { key: 'food_type', label: 'Tipo' },
                { key: 'brand', label: 'Marca' }, { key: 'portion_grams', label: 'Porción (g)', type: 'number', step: '0.1' }
              ]} />
          </>
        )}

        {tab === 'peso' && (
          <>
            <WeightChart petId={pet.id} reloadKey={tick} />
            <CrudSection title="Registro de peso" table="weight_logs" petId={pet.id} canWrite={isOwner} order={{ col: 'measured_on' }} onChange={bump}
              fields={[
                { key: 'measured_on', label: 'Fecha', type: 'date', required: true, default: today() },
                { key: 'weight_kg', label: 'Peso (kg)', type: 'number', step: '0.01', min: '0.01', required: true },
                { key: 'notes', label: 'Notas' }
              ]} />
          </>
        )}

        {tab === 'ejercicio' && (
          <>
            <CrudSection title="Registro de ejercicio" table="exercise_logs" petId={pet.id} canWrite={isOwner} order={{ col: 'performed_on' }}
              fields={[
                { key: 'performed_on', label: 'Fecha', type: 'date', required: true, default: today() },
                { key: 'exercise_type', label: 'Tipo (paseo, carrera…)', required: true },
                { key: 'duration_min', label: 'Duración (min)', type: 'number', min: '1', required: true },
                { key: 'intensity', label: 'Intensidad', options: INTENSITY, default: 'medium' }
              ]} />
            <CrudSection title="Metas" table="goals" petId={pet.id} canWrite={isOwner}
              fields={[
                { key: 'metric', label: 'Métrica', required: true, options: [['weight_kg', 'Peso objetivo (kg)'], ['exercise_min', 'Minutos de ejercicio'], ['walks', 'Número de paseos']] },
                { key: 'target_value', label: 'Valor objetivo', type: 'number', step: '0.1', required: true },
                { key: 'period', label: 'Período', required: true, options: [['week', 'Semanal'], ['month', 'Mensual'], ['once', 'Única']] },
                { key: 'start_date', label: 'Inicio', type: 'date', required: true, default: today() }, { key: 'end_date', label: 'Fin', type: 'date' }
              ]} />
          </>
        )}

        {tab === 'historial' && <Timeline petId={pet.id} />}
      </div>
    </>
  );
}

export default function Page() { return <Shell><PetPage /></Shell>; }
