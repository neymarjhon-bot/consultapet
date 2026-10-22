import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addVaccination, addWeight } from "@/app/actions";

function WeightChart({ points }: { points: { d: string; w: number }[] }) {
  if (points.length < 2) return <p className="text-sm text-ink/70">Registra al menos dos pesos para ver la gráfica.</p>;
  const W = 480, H = 160, P = 24;
  const ws = points.map((p) => p.w);
  const min = Math.min(...ws), max = Math.max(...ws);
  const span = max - min || 1;
  const xy = points.map((p, i) => [P + (i * (W - 2 * P)) / (points.length - 1), H - P - ((p.w - min) / span) * (H - 2 * P)]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evolución del peso" className="w-full bg-white rounded-md border border-[#dbe5e1]">
      <polyline fill="none" stroke="#1f3d36" strokeWidth="2.5" points={xy.map((p) => p.join(",")).join(" ")} />
      {xy.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#e8a33d" />
          <text x={x} y={y - 9} fontSize="11" textAnchor="middle">{points[i].w} kg</text>
        </g>
      ))}
    </svg>
  );
}

export default async function PetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: pet } = await supabase.from("pets").select("*,breeds(name)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!pet) notFound();

  const [{ data: vaccs }, { data: weights }, { data: types }] = await Promise.all([
    supabase.from("vaccinations").select("*,vaccine_types(name)").eq("pet_id", id).order("scheduled_date", { ascending: false }),
    supabase.from("weight_logs").select("*").eq("pet_id", id).order("measured_on"),
    supabase.from("vaccine_types").select("id,name").eq("active", true).order("name"),
  ]);

  return (
    <main className="mx-auto max-w-3xl p-5 md:p-10 space-y-10">
      <header>
        <Link href="/pets" className="text-sm underline">Volver a mis mascotas</Link>
        <h1 className="text-4xl font-extrabold text-pine mt-2">{pet.name}</h1>
        <p className="text-ink/70">
          {pet.breeds?.name ?? pet.breed_other ?? "Sin raza"}
          {pet.birth_date ? `, nació el ${pet.birth_date}` : ""}{pet.birth_place ? ` en ${pet.birth_place}` : ""}
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-bold mb-3">Vacunas</h2>
        <ul className="space-y-2 mb-4">
          {vaccs?.length ? vaccs.map((v: any) => {
            const overdue = !v.applied_date && v.scheduled_date < today;
            return (
              <li key={v.id} className="bg-white rounded-md p-3 border border-[#dbe5e1] text-sm">
                <p className="font-semibold">{v.vaccine_types?.name}</p>
                <p>
                  Programada {v.scheduled_date}.{" "}
                  {v.applied_date
                    ? `Aplicada el ${v.applied_date}${v.vet_name_text ? ` por ${v.vet_name_text}` : ""}${v.batch_number ? `, lote ${v.batch_number}` : ""}.`
                    : <span className={overdue ? "text-alert font-semibold" : ""}>{overdue ? "Vencida, sin aplicar." : "Pendiente."}</span>}
                </p>
                {v.observations && <p className="text-ink/70">{v.observations}</p>}
              </li>
            );
          }) : <li className="text-ink/70">Sin vacunas registradas.</li>}
        </ul>
        <form action={addVaccination.bind(null, id)} className="grid gap-3 sm:grid-cols-2 bg-white p-4 rounded-md border border-[#dbe5e1]">
          <select name="vaccine_type_id" required className="field sm:col-span-2">
            <option value="">Tipo de vacuna</option>
            {types?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <label className="text-sm">Fecha programada<input name="scheduled_date" type="date" required className="field mt-1" /></label>
          <label className="text-sm">Fecha aplicada<input name="applied_date" type="date" className="field mt-1" /></label>
          <input name="vet_name_text" placeholder="Veterinario" className="field" />
          <input name="batch_number" placeholder="Lote" className="field" />
          <input name="observations" placeholder="Observaciones" className="field sm:col-span-2" />
          <button className="btn sm:col-span-2">Guardar vacuna</button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-3">Peso</h2>
        <WeightChart points={(weights ?? []).map((w) => ({ d: w.measured_on, w: Number(w.weight_kg) }))} />
        <form action={addWeight.bind(null, id)} className="grid gap-3 sm:grid-cols-3 mt-4 bg-white p-4 rounded-md border border-[#dbe5e1]">
          <input name="measured_on" type="date" required defaultValue={today} className="field" />
          <input name="weight_kg" type="number" step="0.01" min="0.01" required placeholder="Peso en kg" className="field" />
          <input name="notes" placeholder="Notas" className="field" />
          <button className="btn sm:col-span-3">Guardar peso</button>
        </form>
      </section>
    </main>
  );
}
