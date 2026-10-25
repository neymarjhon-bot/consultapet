import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import { addRecord, deleteRecord, deletePet } from '../actions';

export const dynamic = 'force-dynamic';

const today = () => new Date().toISOString().slice(0, 10);

function Del({ table, id, petId }) {
  return (
    <form action={deleteRecord}>
      <input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={id} />
      <input type="hidden" name="pet_id" value={petId} /><button className="ghost">✕</button>
    </form>
  );
}

function Add({ table, petId, children }) {
  return (
    <details style={{ margin: '8px 0' }}>
      <summary className="btn" style={{ listStyle: 'none' }}>+ Agregar</summary>
      <form action={addRecord} className="row" style={{ marginTop: 8 }}>
        <input type="hidden" name="table" value={table} /><input type="hidden" name="pet_id" value={petId} />
        {children}<button>Guardar</button>
      </form>
    </details>
  );
}
const F = ({ l, n, t = 'text', req, children }) => (
  <div><label>{l}</label>{children || <input name={n} type={t} required={req} step={t === 'number' ? 'any' : undefined} />}</div>
);

function vacBadge(v) {
  if (v.applied_date) return <span className="badge b-ok">Aplicada</span>;
  const d = v.scheduled_date;
  if (!d) return <span className="badge b-pend">Pendiente</span>;
  const days = (new Date(d) - new Date(today())) / 864e5;
  if (days < 0) return <span className="badge b-late">Vencida</span>;
  if (days <= 30) return <span className="badge b-soon">Próxima</span>;
  return <span className="badge b-pend">Programada</span>;
}

export default async function Pet({ params }) {
  const { sb, profile } = await getSession();
  const id = params.id;
  const { data: pet } = await sb.from('pets').select('*, breeds(name), profiles:owner_id(full_name,email,phone)').eq('id', id).single();
  if (!pet) notFound();
  const q = (t, order) => sb.from(t).select(t === 'vaccinations' ? '*, vaccine_types(name)' : '*').eq('pet_id', id).order(order, { ascending: false });
  const [vac, med, drugs, alg, feed, pref, wt, ex, vtypes] = await Promise.all([
    q('vaccinations', 'scheduled_date'), q('medical_records', 'visit_date'), q('medications', 'start_date'),
    q('allergies', 'detected_on'), q('feeding_plans', 'start_date'), sb.from('food_preferences').select('*').eq('pet_id', id),
    q('weight_logs', 'measured_on'), q('exercise_logs', 'performed_on'),
    sb.from('vaccine_types').select('id,name,species').eq('active', true).order('name'),
  ]);
  const isOwner = pet.owner_id === profile.id;
  const canVetWrite = profile.role === 'admin';
  const canWrite = isOwner || canVetWrite;
  const wts = (wt.data || []).slice(0, 12).reverse();
  const maxW = Math.max(1, ...wts.map((w) => Number(w.weight_kg)));
  const byYear = {};
  [...(med.data || [])].forEach((m) => { const y = (m.visit_date || '').slice(0, 4); (byYear[y] ||= []).push(m); });

  return (
    <>
      <div className="card">
        <h1>{pet.species === 'cat' ? '🐱' : '🐶'} {pet.name}</h1>
        <div className="mut">
          {pet.breeds?.name || pet.breed_other || '—'} · {pet.sex} · Nac.: {pet.birth_date || '—'} · {pet.birth_place || ''}
          {pet.microchip && <> · Chip: {pet.microchip}</>}
        </div>
        {pet.origin_type && <div className="mut">Origen: {pet.origin_type}</div>}
        {pet.notes && <p>{pet.notes}</p>}
        {profile.role !== 'owner' && <div className="mut">Dueño: {pet.profiles?.full_name} · {pet.profiles?.email} · {pet.profiles?.phone}</div>}
        <p>
          <a className="btn" href={`/api/pets/${id}/export`}>⬇ Exportar historial (Excel/CSV)</a>{' '}
          {(isOwner || profile.role === 'admin') && (
            <form action={deletePet} style={{ display: 'inline' }}><input type="hidden" name="pet_id" value={id} />
              <button className="ghost">Archivar mascota</button></form>
          )}
        </p>
      </div>

      <div className="card"><h2>💉 Vacunas</h2>
        <div className="tbl"><table><thead><tr><th>Vacuna</th><th>Programada</th><th>Aplicada</th><th>Veterinario</th><th>Lote</th><th>Estado</th><th /></tr></thead><tbody>
          {vac.data?.map((v) => (<tr key={v.id}><td>{v.vaccine_types?.name}</td><td>{v.scheduled_date}</td><td>{v.applied_date || '—'}</td>
            <td>{v.vet_name_text}</td><td>{v.batch_number}</td><td>{vacBadge(v)}</td><td>{canWrite && <Del table="vaccinations" id={v.id} petId={id} />}</td></tr>))}
        </tbody></table></div>
        {canWrite && <Add table="vaccinations" petId={id}>
          <F l="Vacuna"><select name="vaccine_type_id" required>{vtypes.data?.filter((t) => !t.species || t.species === pet.species).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></F>
          <F l="Fecha programada" n="scheduled_date" t="date" /><F l="Fecha aplicada" n="applied_date" t="date" />
          <F l="Veterinario" n="vet_name_text" /><F l="Lote" n="batch_number" /><F l="Observaciones" n="observations" /></Add>}
      </div>

      <div className="card"><h2>🩺 Historial médico (por año)</h2>
        {Object.keys(byYear).sort().reverse().map((y) => (
          <div key={y}><h3>{y}</h3>
            {byYear[y].map((m) => (<div key={m.id} style={{ borderBottom: '1px solid var(--bd)', padding: '6px 0', display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><strong>{m.visit_date}</strong> · {m.reason} <span className="mut">({m.clinic})</span><br />
                <span className="mut">Dx:</span> {m.diagnosis} · <span className="mut">Tx:</span> {m.treatment}</div>
              {canVetWrite && <Del table="medical_records" id={m.id} petId={id} />}</div>))}
          </div>))}
        {canVetWrite && <Add table="medical_records" petId={id}>
          <F l="Fecha" n="visit_date" t="date" req /><F l="Clínica" n="clinic" /><F l="Motivo" n="reason" req />
          <F l="Diagnóstico" n="diagnosis" /><F l="Tratamiento" n="treatment" /><F l="Notas" n="notes" /></Add>}
        {!canVetWrite && <p className="mut">Las consultas las registra el administrador veterinario.</p>}
        <h3>Medicamentos</h3>
        <table><tbody>{drugs.data?.map((d) => (<tr key={d.id}><td>{d.name}</td><td>{d.dose}</td><td>{d.frequency}</td><td>{d.start_date} → {d.end_date || '…'}</td><td>{canVetWrite && <Del table="medications" id={d.id} petId={id} />}</td></tr>))}</tbody></table>
        {canVetWrite && <Add table="medications" petId={id}><F l="Nombre" n="name" req /><F l="Dosis" n="dose" /><F l="Frecuencia" n="frequency" /><F l="Inicio" n="start_date" t="date" /><F l="Fin" n="end_date" t="date" /></Add>}
        <h3>Alergias</h3>
        <table><tbody>{alg.data?.map((a) => (<tr key={a.id}><td>{a.allergen}</td><td>{a.reaction}</td><td>{a.severity}</td><td>{canWrite && <Del table="allergies" id={a.id} petId={id} />}</td></tr>))}</tbody></table>
        {canWrite && <Add table="allergies" petId={id}><F l="Alérgeno" n="allergen" req /><F l="Reacción" n="reaction" /><F l="Severidad" n="severity" /><F l="Detectada" n="detected_on" t="date" /></Add>}
      </div>

      <div className="card"><h2>🍖 Alimentación</h2>
        <table><thead><tr><th>Etapa</th><th>Alimento</th><th>Marca</th><th>g/día</th><th>Comidas</th><th>Horario</th><th /></tr></thead><tbody>
          {feed.data?.map((f) => (<tr key={f.id}><td>{{ puppy: 'Cachorro', adult: 'Adulto', senior: 'Senior' }[f.stage]}</td><td>{f.food_type}</td><td>{f.brand}</td><td>{f.daily_grams}</td><td>{f.meals_per_day}</td><td>{f.schedule}</td><td>{canWrite && <Del table="feeding_plans" id={f.id} petId={id} />}</td></tr>))}</tbody></table>
        {canWrite && <Add table="feeding_plans" petId={id}>
          <F l="Etapa"><select name="stage"><option value="puppy">Cachorro</option><option value="adult">Adulto</option><option value="senior">Senior</option></select></F>
          <F l="Tipo" n="food_type" /><F l="Marca" n="brand" /><F l="Gramos/día" n="daily_grams" t="number" /><F l="Comidas/día" n="meals_per_day" t="number" /><F l="Horarios" n="schedule" /><F l="Inicio" n="start_date" t="date" /></Add>}
        <h3>Favoritos y restricciones</h3>
        <table><tbody>{pref.data?.map((p) => (<tr key={p.id}><td>{p.kind}</td><td>{p.description}</td><td>{canWrite && <Del table="food_preferences" id={p.id} petId={id} />}</td></tr>))}</tbody></table>
        {canWrite && <Add table="food_preferences" petId={id}>
          <F l="Tipo"><select name="kind"><option value="favorite">Favorita</option><option value="restriction">Restricción</option></select></F><F l="Descripción" n="description" req /></Add>}
      </div>

      <div className="card"><h2>⚖️ Peso</h2>
        <div className="bars" style={{ marginTop: 20 }}>
          {wts.map((w) => (<div key={w.id} title={`${w.measured_on}: ${w.weight_kg} kg`} style={{ height: `${(Number(w.weight_kg) / maxW) * 100}%` }}><span>{w.weight_kg}</span></div>))}
        </div>
        <div className="tbl"><table><tbody>{wt.data?.map((w) => (<tr key={w.id}><td>{w.measured_on}</td><td>{w.weight_kg} kg</td><td>{w.notes}</td><td>{canWrite && <Del table="weight_logs" id={w.id} petId={id} />}</td></tr>))}</tbody></table></div>
        {canWrite && <Add table="weight_logs" petId={id}><F l="Fecha" n="measured_on" t="date" req /><F l="Peso (kg)" n="weight_kg" t="number" req /><F l="Notas" n="notes" /></Add>}
      </div>

      <div className="card"><h2>🏃 Ejercicio</h2>
        <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Min</th><th>Intensidad</th><th /></tr></thead><tbody>
          {ex.data?.map((e) => (<tr key={e.id}><td>{e.performed_on}</td><td>{e.exercise_type}</td><td>{e.duration_min}</td><td>{e.intensity}</td><td>{canWrite && <Del table="exercise_logs" id={e.id} petId={id} />}</td></tr>))}</tbody></table>
        {canWrite && <Add table="exercise_logs" petId={id}><F l="Fecha" n="performed_on" t="date" req /><F l="Tipo" n="exercise_type" req />
          <F l="Duración (min)" n="duration_min" t="number" /><F l="Intensidad"><select name="intensity"><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></F></Add>}
      </div>
    </>
  );
}
