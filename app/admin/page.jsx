'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import CrudSection from '@/components/CrudSection';
import { supabase } from '@/lib/supabase';
import { ROLE_LABEL } from '@/lib/utils';

function Users() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  const load = async () => {
    const { data } = await supabase.from('profiles').select('id,email,full_name,role,created_at').order('created_at', { ascending: false });
    setUsers(data || []);
  };
  useEffect(() => { load(); }, []);
  async function setRole(id, role) {
    setErr('');
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) setErr(error.message); else load();
  }
  return (
    <section className="card">
      <h3 className="mb-3 font-semibold">Usuarios y roles</h3>
      {err && <p className="mb-2 text-xs text-red-700">{err}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-stone-500"><tr><th className="px-2 py-1">Nombre</th><th className="px-2 py-1">Correo</th><th className="px-2 py-1">Rol</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-stone-100">
                <td className="px-2 py-2">{u.full_name || '—'}</td><td className="px-2 py-2">{u.email}</td>
                <td className="px-2 py-2">
                  <select className="input !w-auto" value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
                    {Object.entries(ROLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Admin() {
  const [tab, setTab] = useState('users');
  const tabs = [['users', 'Usuarios'], ['catalogs', 'Catálogos']];
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">Administración</h1>
      <div className="mb-4 flex gap-1 border-b border-stone-200">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-sm ${tab === k ? 'border-b-2 border-brand-600 font-medium text-brand-700' : 'text-stone-500'}`}>{l}</button>
        ))}
      </div>
      <div className="space-y-4">
        {tab === 'users' && <Users />}
        {tab === 'catalogs' && (
          <>
            <CrudSection title="Razas" table="breeds" order={{ col: 'name', asc: true }}
              fields={[{ key: 'name', label: 'Nombre', required: true }, { key: 'species', label: 'Especie', required: true, default: 'dog', options: [['dog', 'Perro'], ['cat', 'Gato'], ['other', 'Otro']] }, { key: 'size', label: 'Tamaño', options: [['small', 'Pequeño'], ['medium', 'Mediano'], ['large', 'Grande'], ['giant', 'Gigante']] }]} />
            <CrudSection title="Tipos de vacuna" table="vaccine_types" order={{ col: 'name', asc: true }}
              fields={[{ key: 'name', label: 'Nombre', required: true }, { key: 'species', label: 'Aplica a', required: true, default: 'all', options: [['dog', 'Perros'], ['cat', 'Gatos'], ['all', 'Ambos']] }, { key: 'description', label: 'Descripción' }, { key: 'interval_days', label: 'Refuerzo (días)', type: 'number' }]} />
          </>
        )}
      </div>
    </>
  );
}

export default function Page() { return <Shell roles={['admin']}><Admin /></Shell>; }
