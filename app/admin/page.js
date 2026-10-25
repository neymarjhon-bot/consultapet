import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function setRole(fd) {
  'use server';
  const { sb, profile } = await getSession();
  if (profile?.role !== 'admin') throw new Error('Solo administradores');
  const role = fd.get('role');
  if (!['owner', 'admin'].includes(role)) throw new Error('Rol inválido');
  const { error } = await sb.from('profiles').update({ role }).eq('id', fd.get('id'));
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export default async function Admin() {
  const { sb, profile } = await getSession();
  if (profile.role !== 'admin') redirect('/');
  const [{ data: users }, { data: audit }] = await Promise.all([
    sb.from('profiles').select('id,email,full_name,role,created_at').order('created_at'),
    sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(30),
  ]);
  return (
    <>
      <div className="card"><h2>Usuarios y roles</h2>
        <div className="tbl"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th /></tr></thead><tbody>
          {users?.map((u) => (<tr key={u.id}><td>{u.full_name}</td><td>{u.email}</td>
            <td colSpan={2}><form action={setRole} style={{ display: 'flex', gap: 6 }}>
              <input type="hidden" name="id" value={u.id} />
              <select name="role" defaultValue={u.role}><option value="owner">Dueño</option><option value="admin">Administrador veterinario</option></select>
              <button>Guardar</button></form></td></tr>))}</tbody></table></div>
      </div>
      <div className="card"><h2>Auditoría (últimos 30 cambios)</h2>
        <div className="tbl"><table><thead><tr><th>Fecha</th><th>Tabla</th><th>Acción</th><th>Actor</th></tr></thead><tbody>
          {audit?.map((a) => (<tr key={a.id}><td>{new Date(a.created_at).toLocaleString('es-CL')}</td><td>{a.table_name}</td><td>{a.action}</td><td className="mut">{a.actor_id?.slice(0, 8)}</td></tr>))}</tbody></table></div>
      </div>
    </>
  );
}
