import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { addBreed, addVaccineType, setRole, toggleCatalog } from '@/app/actions';
import { fmtDate } from '@/lib/format';
import Flash from '@/components/Flash';

export default async function Admin({ searchParams }: { searchParams: Promise<{ t?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams; const t = sp.t ?? 'users';
  const { supabase, user } = await requireAdmin();
  const tabs = [['users', 'Usuarios'], ['catalog', 'Catálogos'], ['audit', 'Auditoría']];
  let body: React.ReactNode = null;

  if (t === 'users') {
    const { data: users } = await supabase.from('profiles').select('id,full_name,email,role,phone,created_at').order('created_at');
    body = (
      <section className="card"><h2>Usuarios y roles</h2>
        <p className="sub">Los dueños se registran solos. Aquí puedes ascender a alguien a administrador veterinario.</p>
        <div className="scroll"><table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Registro</th><th>Rol</th></tr></thead>
          <tbody>{users?.map((u: any) => (
            <tr key={u.id}><td>{u.full_name || '—'}</td><td>{u.email}</td><td>{fmtDate(u.created_at)}</td>
              <td><form action={setRole} style={{ display: 'flex', gap: '.4rem' }}>
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue={u.role} aria-label={`Rol de ${u.email}`} disabled={u.id === user.id}>
                  <option value="owner">Dueño</option><option value="admin">Administrador veterinario</option>
                </select>
                {u.id !== user.id && <button className="btn sm">Guardar</button>}
              </form></td></tr>))}</tbody>
        </table></div>
      </section>
    );
  } else if (t === 'catalog') {
    const [{ data: breeds }, { data: vts }] = await Promise.all([
      supabase.from('breeds').select('*').order('name'), supabase.from('vaccine_types').select('*').order('name'),
    ]);
    body = (
      <>
        <section className="card"><h2>Razas</h2>
          <div className="scroll"><table><thead><tr><th>Nombre</th><th>Especie</th><th>Tamaño</th><th>Estado</th><th /></tr></thead>
            <tbody>{breeds?.map((b: any) => (<tr key={b.id}><td>{b.name}</td><td>{b.species}</td><td>{b.size ?? '—'}</td>
              <td><span className={`badge ${b.active ? 'b-ok' : 'b-plain'}`}>{b.active ? 'Activa' : 'Inactiva'}</span></td>
              <td><form action={toggleCatalog.bind(null, 'breeds', b.id, b.active)}><button className="btn ghost sm">{b.active ? 'Desactivar' : 'Activar'}</button></form></td></tr>))}</tbody></table></div>
          <details style={{ marginTop: '.8rem' }}><summary>Agregar raza</summary>
            <form action={addBreed} className="f">
              <label>Nombre<input name="name" required /></label>
              <label>Especie<select name="species"><option value="dog">Perro</option><option value="cat">Gato</option><option value="other">Otro</option></select></label>
              <label>Tamaño<input name="size" placeholder="Pequeño, mediano, grande" /></label>
              <div className="wide"><button className="btn">Guardar</button></div></form></details>
        </section>
        <section className="card"><h2>Tipos de vacuna</h2>
          <div className="scroll"><table><thead><tr><th>Nombre</th><th>Refuerzo (días)</th><th>Especie</th><th>Estado</th><th /></tr></thead>
            <tbody>{vts?.map((v: any) => (<tr key={v.id}><td>{v.name}</td><td>{v.interval_days ?? '—'}</td><td>{v.species}</td>
              <td><span className={`badge ${v.active ? 'b-ok' : 'b-plain'}`}>{v.active ? 'Activa' : 'Inactiva'}</span></td>
              <td><form action={toggleCatalog.bind(null, 'vaccine_types', v.id, v.active)}><button className="btn ghost sm">{v.active ? 'Desactivar' : 'Activar'}</button></form></td></tr>))}</tbody></table></div>
          <details style={{ marginTop: '.8rem' }}><summary>Agregar tipo de vacuna</summary>
            <form action={addVaccineType} className="f">
              <label>Nombre<input name="name" required /></label>
              <label>Refuerzo cada (días)<input name="interval_days" type="number" min="1" /></label>
              <label>Especie<select name="species"><option value="all">Todas</option><option value="dog">Perro</option><option value="cat">Gato</option></select></label>
              <label className="wide">Descripción<input name="description" /></label>
              <div className="wide"><button className="btn">Guardar</button></div></form></details>
        </section>
      </>
    );
  } else {
    const { data: logs } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100);
    const names = new Map<string, string>();
    const { data: profs } = await supabase.from('profiles').select('id,full_name,email');
    profs?.forEach((p: any) => names.set(p.id, p.full_name || p.email));
    body = (
      <section className="card"><h2>Últimos 100 cambios</h2>
        <div className="scroll"><table><thead><tr><th>Fecha</th><th>Tabla</th><th>Acción</th><th>Usuario</th><th>Detalle</th></tr></thead>
          <tbody>{logs?.map((l: any) => (<tr key={l.id}><td>{new Date(l.created_at).toLocaleString('es-CL')}</td><td>{l.table_name}</td><td>{l.action}</td>
            <td>{l.actor_id ? names.get(l.actor_id) ?? l.actor_id.slice(0, 8) : 'Sistema'}</td>
            <td style={{ maxWidth: 320, fontSize: '.8rem', color: 'var(--muted)' }}>{JSON.stringify(l.new_data ?? l.old_data ?? {}).slice(0, 140)}</td></tr>))}</tbody></table></div>
      </section>
    );
  }

  return (
    <>
      <div className="head"><div><h1>Administración</h1><p className="sub">Usuarios, catálogos y trazabilidad del sistema.</p></div></div>
      <Flash error={sp.error} ok={sp.ok} />
      <nav className="tabs">{tabs.map(([k, l]) => <Link key={k} href={`/admin?t=${k}`} className={t === k ? 'on' : ''}>{l}</Link>)}</nav>
      {body}
    </>
  );
}
