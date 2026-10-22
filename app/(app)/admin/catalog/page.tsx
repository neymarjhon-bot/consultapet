import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { addCatalogItem, toggleCatalogItem } from "../actions";
import { SPECIES } from "@/lib/labels";

export default async function CatalogPage() {
  const { supabase } = await requireAdmin();
  const [{ data: vt }, { data: br }] = await Promise.all([
    supabase.from("vaccine_types").select("*").order("name"),
    supabase.from("breeds").select("*").order("name"),
  ]);
  const Row = ({ table, r, extra }: { table: string; r: any; extra: string }) => (
    <li className="bg-white rounded-md p-3 border border-[#dbe5e1] text-sm flex justify-between gap-3">
      <span className={r.active ? "" : "text-ink/40 line-through"}><span className="font-semibold">{r.name}</span>{extra && `, ${extra}`}</span>
      <form action={toggleCatalogItem.bind(null, table, r.id, !r.active)}>
        <button className="text-xs underline">{r.active ? "Desactivar" : "Activar"}</button>
      </form>
    </li>
  );
  const sp = (
    <select name="species" className="field" defaultValue="dog">
      {Object.entries(SPECIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
  return (
    <main className="space-y-10">
      <Link href="/admin" className="text-sm underline">Volver a administración</Link>
      <section>
        <h1 className="text-2xl font-extrabold text-pine mb-3">Tipos de vacuna</h1>
        <ul className="space-y-2">
          {vt?.map((r: any) => <Row key={r.id} table="vaccine_types" r={r} extra={[r.species === "all" ? "todas las especies" : SPECIES[r.species], r.interval_days && `cada ${r.interval_days} días`].filter(Boolean).join(", ")} />)}
        </ul>
        <form action={addCatalogItem.bind(null, "vaccine_types")} className="grid gap-3 sm:grid-cols-2 bg-white p-4 rounded-md border border-[#dbe5e1] mt-3">
          <input name="name" required placeholder="Nombre" className="field" />
          <input name="description" placeholder="Descripción" className="field" />
          <input name="interval_days" type="number" min="1" placeholder="Refuerzo cada (días)" className="field" />
          <select name="species" className="field" defaultValue="all"><option value="all">Todas</option><option value="dog">Perro</option><option value="cat">Gato</option></select>
          <button className="btn sm:col-span-2">Agregar vacuna</button>
        </form>
      </section>
      <section>
        <h2 className="text-2xl font-extrabold text-pine mb-3">Razas</h2>
        <ul className="space-y-2">
          {br?.map((r: any) => <Row key={r.id} table="breeds" r={r} extra={[SPECIES[r.species], r.size].filter(Boolean).join(", ")} />)}
        </ul>
        <form action={addCatalogItem.bind(null, "breeds")} className="grid gap-3 sm:grid-cols-2 bg-white p-4 rounded-md border border-[#dbe5e1] mt-3">
          <input name="name" required placeholder="Nombre" className="field" />
          <input name="size" placeholder="Tamaño (pequeño, mediano, grande)" className="field" />
          {sp}
          <button className="btn">Agregar raza</button>
        </form>
      </section>
    </main>
  );
}
