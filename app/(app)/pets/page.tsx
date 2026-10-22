import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SPECIES } from "@/lib/labels";

export default async function PetsPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: pets }, { data: pending }] = await Promise.all([
    supabase.from("pets").select("id,name,species,birth_date,breed_other,breeds(name)")
      .eq("owner_id", user.id).is("deleted_at", null).order("name"),
    supabase.from("vaccinations").select("id,pet_id,scheduled_date,vaccine_types(name),pets!inner(name,owner_id,deleted_at)")
      .is("applied_date", null).eq("pets.owner_id", user.id).is("pets.deleted_at", null)
      .order("scheduled_date").limit(12),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold text-pine mb-6">Mis mascotas</h1>

      {pending && pending.length > 0 && (
        <section aria-label="Vacunas pendientes" className="mb-8 border-l-4 border-amber bg-white p-4 rounded-r-md">
          <h2 className="font-bold mb-2">Vacunas pendientes</h2>
          <ul className="space-y-1 text-sm">
            {pending.map((v: any) => {
              const overdue = v.scheduled_date < today;
              return (
                <li key={v.id}>
                  <Link href={`/pets/${v.pet_id}?tab=vacunas`} className="underline">{v.pets?.name}</Link>: {v.vaccine_types?.name},{" "}
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
                <p className="text-sm text-ink/70">
                  {SPECIES[p.species]}, {p.breeds?.name ?? p.breed_other ?? "sin raza"}{p.birth_date ? `, nació el ${p.birth_date}` : ""}
                </p>
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
