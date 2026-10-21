'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';

const FIELDS = [
  ['name', 'Nombre *', 'text'], ['species', 'Especie', 'species'], ['breed_id', 'Raza', 'breed'], ['breed_other', 'Otra raza / mestizo', 'text'],
  ['sex', 'Sexo', 'sex'], ['birth_date', 'Fecha de nacimiento', 'date'], ['birth_place', 'Lugar de nacimiento', 'text'],
  ['microchip', 'Microchip', 'text'], ['color', 'Color', 'text'],
  ['origin_type', 'Origen', 'origin'],
  ['notes', 'Notas', 'textarea']
];

export default function PetForm({ pet }) {
  const { session } = useAuth();
  const router = useRouter();
  const [breeds, setBreeds] = useState([]);
  const [form, setForm] = useState(() => ({ ...Object.fromEntries(FIELDS.map(([k]) => [k, pet?.[k] ?? ''])), species: pet?.species || 'dog' }));
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('breeds').select('id,name').eq('active', true).eq('species', form.species).order('name').then(({ data }) => setBreeds(data || []));
  }, [form.species]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const payload = {};
    FIELDS.forEach(([k]) => { payload[k] = form[k] === '' ? null : form[k]; });
    if (payload.breed_id) payload.breed_id = Number(payload.breed_id);
    payload.sex = payload.sex || 'unknown';
    payload.species = form.species || 'dog';

    let id = pet?.id, ownerId = pet?.owner_id || session.user.id;
    if (pet) {
      const { error } = await supabase.from('pets').update(payload).eq('id', pet.id);
      if (error) { setErr(error.message); setBusy(false); return; }
    } else {
      const { data, error } = await supabase.from('pets').insert({ ...payload, owner_id: ownerId }).select('id').single();
      if (error) { setErr(error.message); setBusy(false); return; }
      id = data.id;
    }
    if (file) {
      const path = `${ownerId}/${id}/main-${Date.now()}.${file.name.split('.').pop()}`;
      const up = await supabase.storage.from('pet-photos').upload(path, file, { upsert: true });
      if (up.error) { setErr('La mascota se guardó, pero la foto falló: ' + up.error.message); setBusy(false); return; }
      await supabase.from('pets').update({ photo_path: path }).eq('id', id);
    }
    router.replace(`/pets/${id}`);
  }

  const bind = (k) => ({ className: 'input', value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <form onSubmit={submit} className="card grid gap-3 sm:grid-cols-2">
      {FIELDS.map(([k, label, type]) => (
        <div key={k} className={type === 'textarea' ? 'sm:col-span-2' : ''}>
          <label className="label">{label}</label>
          {type === 'species' ? (
            <select className="input" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value, breed_id: '' })}>
              <option value="dog">Perro</option><option value="cat">Gato</option><option value="other">Otro</option>
            </select>
          ) : type === 'breed' ? (
            <select {...bind(k)}><option value="">Seleccionar…</option>{breeds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          ) : type === 'sex' ? (
            <select {...bind(k)}><option value="">Seleccionar…</option><option value="male">Macho</option><option value="female">Hembra</option></select>
          ) : type === 'origin' ? (
            <select {...bind(k)}><option value="">Seleccionar…</option><option value="criadero">Criadero</option><option value="adopcion">Adopción</option><option value="regalo">Regalo</option><option value="otro">Otro</option></select>
          ) : type === 'textarea' ? <textarea rows={3} {...bind(k)} /> : (
            <input type={type} required={k === 'name'} {...bind(k)} />
          )}
        </div>
      ))}
      <div className="sm:col-span-2">
        <label className="label">Foto</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
      </div>
      {err && <p className="rounded bg-red-50 p-2 text-xs text-red-700 sm:col-span-2">{err}</p>}
      <div className="sm:col-span-2"><button className="btn" disabled={busy}>{busy ? 'Guardando…' : pet ? 'Guardar cambios' : 'Registrar mascota'}</button></div>
    </form>
  );
}
