import { createClient } from "@/lib/supabase/server";
import { createPet } from "@/app/actions";

export default async function NewPet() {
  const supabase = await createClient();
  const { data: breeds } = await supabase.from("breeds").select("id,name,species").eq("active", true).order("name");
  return (
    <main className="max-w-xl">
      <h1 className="text-3xl font-extrabold text-pine mb-6">Nueva mascota</h1>
      <form action={createPet} className="space-y-4">
        <input name="name" required placeholder="Nombre" className="field" />
        <div className="grid grid-cols-2 gap-3">
          <select name="species" className="field" defaultValue="dog">
            <option value="dog">Perro</option><option value="cat">Gato</option><option value="other">Otro</option>
          </select>
          <select name="sex" className="field" defaultValue="unknown">
            <option value="male">Macho</option><option value="female">Hembra</option><option value="unknown">No sé</option>
          </select>
        </div>
        <select name="breed_id" className="field" defaultValue="">
          <option value="">Raza (elige una)</option>
          {breeds?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input name="breed_other" placeholder="Otra raza (si no está en la lista)" className="field" />
        <label className="block text-sm">Fecha de nacimiento<input name="birth_date" type="date" className="field mt-1" /></label>
        <input name="birth_place" placeholder="Lugar de nacimiento" className="field" />
        <input name="color" placeholder="Color" className="field" />
        <button className="btn">Guardar mascota</button>
      </form>
    </main>
  );
}
