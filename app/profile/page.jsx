'use client';
import { useState } from 'react';
import Shell from '@/components/Shell';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ROLE_LABEL } from '@/lib/utils';

function Profile() {
  const { profile, reloadProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile.full_name || '', phone: profile.phone || '', address_line: profile.address_line || '',
    city: profile.city || '', region: profile.region || '', country: profile.country || ''
  });
  const [pwd, setPwd] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function save(e) {
    e.preventDefault(); setMsg(''); setErr('');
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id);
    if (error) setErr(error.message); else { setMsg('Perfil actualizado.'); reloadProfile(); }
  }
  async function changePwd(e) {
    e.preventDefault(); setMsg(''); setErr('');
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) setErr(error.message); else { setMsg('Contraseña actualizada.'); setPwd(''); }
  }
  const F = (k, label) => (
    <div><label className="label">{label}</label><input className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold">Mi perfil</h1>
      <form onSubmit={save} className="card grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 text-sm text-stone-500">{profile.email} · {ROLE_LABEL[profile.role]}</div>
        {F('full_name', 'Nombre completo')}{F('phone', 'Teléfono')}
        <div className="sm:col-span-2">{F('address_line', 'Dirección')}</div>
        {F('city', 'Ciudad')}{F('region', 'Región')}{F('country', 'País')}
        <div className="sm:col-span-2"><button className="btn">Guardar</button></div>
      </form>
      <form onSubmit={changePwd} className="card flex items-end gap-3">
        <div className="flex-1"><label className="label">Nueva contraseña (mín. 8 caracteres)</label>
          <input type="password" minLength={8} required className="input" value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
        <button className="btn">Cambiar</button>
      </form>
      {err && <p className="rounded bg-red-50 p-2 text-xs text-red-700">{err}</p>}
      {msg && <p className="rounded bg-green-50 p-2 text-xs text-green-800">{msg}</p>}
    </div>
  );
}

export default function Page() { return <Shell><Profile /></Shell>; }
