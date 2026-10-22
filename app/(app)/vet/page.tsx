import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SPECIES } from "@/lib/labels";

export default async function VetPage() {
  const { supabase, user, profile } = await requireUser();
  if (profile.role === "admin") redirect("/admin");
  if (profile.role !== "vet") redirect("/pets");
  const { data } = await supabase.from("pet_vets")
    .select("pets(id,name,species,deleted_at,profiles(full_name))").eq("vet_id", user.id);
  const pets = (data ?? []).map((r: any) => r.pets).filter((p: any) => p && !p.deleted_at);
  return (
    <main>
      <h1 className="text-3xl font-extrabold text-pine mb-6">Mis pacientes</h1>
      {pets.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {pets.map((p: any) => (
            <li key={p.id}>
              <Link href={`/pets/${p.id}?tab=salud`} className="block bg-white rounded-md p-4 border border-[#dbe5e1] hover:border-pine">
                <p className="text-xl font-bold">{p.name}</p>
                <p className="text-sm text-ink/70">{SPECIES[p.species]}, dueño: {p.profiles?.full_name || "sin nombre"}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/70">Aún no tienes pacientes. Un dueño debe darte acceso con tu correo desde la ficha de su mascota, pestaña Veterinarios.</p>
      )}
    </main>
  );
}
