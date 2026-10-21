'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function ShareVet({ petId }) {
  const [vets, setVets] = useState([]);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('list_pet_vets', { p_pet: petId });
    setVets(data || []);
  }, [petId]);
  useEffect(() => { load(); }, [load]);

  async function grant(e) {
    e.preventDefault(); setErr(''); setMsg('');
    const { error } = await supabase.rpc('grant_vet_access', { p_pet: petId, p_email: email });
    if (error) setErr(error.message); else { setMsg('Acceso otorgado.'); setEmail(''); load(); }
  }
  async function revoke(id) {
    await supabase.from('pet_vets').delete().eq('pet_id', petId).eq('vet_id', id);
    load();
  }

  return (
    <section className="card no-print">
      <h3 className="mb-2 font-semibold">Compartir con veterinario</h3>
      <p className="mb-3 text-xs text-stone-500">El veterinario podrá ver el historial y registrar vacunas y consultas de esta mascota. Debe tener cuenta con rol Veterinario.</p>
      <form onSubmit={grant} className="flex gap-2">
        <input type="email" required placeholder="correo del veterinario" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn">Dar acceso</button>
      </form>
      {err && <p className="mt-2 text-xs text-red-700">{err}</p>}
      {msg && <p className="mt-2 text-xs text-green-700">{msg}</p>}
      <ul className="mt-3 space-y-1 text-sm">
        {vets.map((v) => (
          <li key={v.vet_id} className="flex justify-between">
            <span>{v.full_name || v.email} <span className="text-xs text-stone-500">({v.email})</span></span>
            <button className="btn-danger" onClick={() => revoke(v.vet_id)}>Quitar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
