import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { setRole } from "./actions";
import { ROLE, SPECIES } from "@/lib/labels";

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();
  const [{ data: users }, { data: pets }] = await Promise.all([
    supabase.from("profiles").select("id,email,full_name,role,created_at").order("created_at"),
    supabase.from("pets").select("id,name,species,deleted_at,profiles(full_name,email)").is("deleted_at", null).order("name"),
  ]);
  return (
    <main className="space-y-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-pine">Administración</h1>
        <Link href="/admin/catalog" className="btn-ghost text-sm">Catálogos de vacunas y razas</Link>
      </header>

      <section>
        <h2 className="text-xl font-bold mb-3">Usuarios ({users?.length ?? 0})</h2>
        <div className="overflow-x-auto bg-white rounded-md border border-[#dbe5e1]">
          <table className="w-full text-sm">
            <thead className="text-left text-ink/60"><tr><th className="p-3">Nombre</th><th className="p-3">Correo</th><th className="p-3">Rol</th></tr></thead>
            <tbody>
              {users?.map((u: any) => (
                <tr key={u.id} className="border-t border-[#e6eeea]">
                  <td className="p-3">{u.full_name || "-"}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    {u.id === user.id ? ROLE[u.role] + " (tú)" : (
                      <form action={setRole.bind(null, u.id)} className="flex gap-2">
                        <select name="role" defaultValue={u.role} className="field !w-auto !py-1">
                          {Object.entries(ROLE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                        <button className="btn-ghost text-xs">Cambiar</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Todas las mascotas ({pets?.length ?? 0})</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {pets?.map((p: any) => (
            <li key={p.id}>
              <Link href={`/pets/${p.id}`} className="block bg-white rounded-md p-3 border border-[#dbe5e1] hover:border-pine text-sm">
                <span className="font-bold">{p.name}</span>, {SPECIES[p.species]}<br />
                <span className="text-ink/60">Dueño: {p.profiles?.full_name || p.profiles?.email}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
