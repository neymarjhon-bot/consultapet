import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function PetsPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: pets }, { data: pending }] = await Promise.all([
    supabase.from("pets").select("id,name,species,birth_date,breed_other,breeds(name)").is("deleted_at", null).order("name"),
    supabase.from("vaccinations").select("id,pet_id,scheduled_date,vaccine_types(name),pets(name)")
      .is("applied_date", null).order("scheduled_date").limit(10),
  ]);

  return (
    <main className="mx-auto max-w-3xl p-5 md:p-10">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-pine">Mis mascotas</h1>
        <form action={signOut}><button className="btn-ghost text-sm">Salir</button></form>
      </header>

      {pending && pending.length > 0 && (
        <section aria-label="Vacunas pendientes" className="mb-8 border-l-4 border-amber bg-white p-4 rounded-r-md">
          <h2 className="font-bold mb-2">Vacunas pendientes</h2>
          <ul className="space-y-1 text-sm">
            {pending.map((v: any) => {
              const overdue = v.scheduled_date < today;
              return (
                <li key={v.id}>
                  <Link href={`/pets/${v.pet_id}`} className="underline">{v.pets?.name}</Link>: {v.vaccine_types?.name},{" "}
                  <span className={overdue ? "text-alert font-semibold" : ""}>
                    {overdue ? "vencida desde " : "programada para "}{v.scheduled_date}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {pets && pets.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {pets.map((p: any) => (
            <li key={p.id}>
              <Link href={`/pets/${p.id}`} className="block bg-white rounded-md p-4 border border-[#dbe5e1] hover:border-pine">
                <p className="text-xl font-bold">{p.name}</p>
                <p className="text-sm text-ink/70">{p.breeds?.name ?? p.breed_other ?? "Sin raza"}{p.birth_date ? `, nació el ${p.birth_date}` : ""}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/70">Aún no registras mascotas. Agrega la primera para empezar su historial.</p>
      )}
      <Link href="/pets/new" className="btn inline-block mt-6">Agregar mascota</Link>
    </main>
  );
}
