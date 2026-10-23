import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth'
import { setRole, addVaccineType } from './actions'

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams
  const { supabase, isAdmin, user } = await getSessionProfile()
  if (!isAdmin) redirect('/')

  const [{ data: users }, { data: vtypes }, { data: audit }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at'),
    supabase.from('vaccine_types').select('id, name, interval_days, active').order('name'),
    supabase.from('audit_log').select('id, table_name, action, actor_id, created_at').order('created_at', { ascending: false }).limit(30),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Administración</h1>
      {sp.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-brick-600">{sp.error}</p>}

      <section className="card">
        <h2 className="mb-3 font-semibold">Usuarios y perfiles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-pine-100 text-xs text-pine-700"><th className="py-1 pr-3 font-medium">Nombre</th><th className="pr-3 font-medium">Correo</th><th className="font-medium">Perfil</th></tr></thead>
            <tbody>
              {(users ?? []).map((u: any) => {
                const admin = u.role === 'admin' || u.role === 'vet'
                return (
                  <tr key={u.id} className="border-b border-pine-50 last:border-0">
                    <td className="py-2 pr-3">{u.full_name || '—'}</td>
                    <td className="pr-3">{u.email}</td>
                    <td>
                      {u.id === user.id ? <span className="text-pine-700">Administrador veterinario (tú)</span> : (
                        <form action={setRole} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={u.id} />
                          <select name="role" defaultValue={admin ? 'admin' : 'owner'} className="input w-auto py-1">
                            <option value="owner">Dueño</option>
                            <option value="admin">Administrador veterinario</option>
                          </select>
                          <button className="btn-ghost py-1">Guardar</button>
                        </form>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Catálogo de vacunas</h2>
        <ul className="mb-3 flex flex-wrap gap-2 text-sm">
          {(vtypes ?? []).map((v: any) => <li key={v.id} className="rounded-full bg-pine-50 px-3 py-1">{v.name}{v.interval_days ? ` · cada ${v.interval_days} d` : ''}</li>)}
        </ul>
        <form action={addVaccineType} className="flex flex-wrap items-end gap-2">
          <div><label className="label" htmlFor="vn">Nueva vacuna</label><input id="vn" name="name" required className="input" /></div>
          <div><label className="label" htmlFor="vd">Refuerzo cada (días)</label><input id="vd" name="interval_days" type="number" min={1} className="input" /></div>
          <button className="btn">Agregar</button>
        </form>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Auditoría reciente</h2>
        {(audit ?? []).length === 0 ? <p className="text-sm text-pine-700">Sin cambios registrados todavía.</p> : (
          <ul className="divide-y divide-pine-50 text-sm">
            {(audit ?? []).map((a: any) => (
              <li key={a.id} className="flex gap-3 py-1.5"><span className="w-40 shrink-0 text-pine-700">{new Date(a.created_at).toLocaleString('es-CL')}</span><span className="w-24 shrink-0 font-medium">{a.action}</span><span>{a.table_name}</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
