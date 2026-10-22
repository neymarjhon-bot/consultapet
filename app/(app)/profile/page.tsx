import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/app/actions";
import { Lbl } from "@/components/ui";

export default async function ProfilePage() {
  const { profile } = await requireUser();
  return (
    <main className="max-w-xl">
      <h1 className="text-3xl font-extrabold text-pine mb-6">Mi perfil</h1>
      <form action={updateProfile} className="grid gap-3 sm:grid-cols-2">
        <Lbl t="Correo"><input value={profile.email ?? ""} disabled className="field opacity-70" readOnly /></Lbl>
        <Lbl t="Nombre completo"><input name="full_name" required defaultValue={profile.full_name} className="field" /></Lbl>
        <Lbl t="Teléfono"><input name="phone" defaultValue={profile.phone ?? ""} className="field" /></Lbl>
        <Lbl t="Dirección"><input name="address_line" defaultValue={profile.address_line ?? ""} className="field" /></Lbl>
        <Lbl t="Ciudad"><input name="city" defaultValue={profile.city ?? ""} className="field" /></Lbl>
        <Lbl t="Región"><input name="region" defaultValue={profile.region ?? ""} className="field" /></Lbl>
        <Lbl t="País"><input name="country" defaultValue={profile.country ?? ""} className="field" /></Lbl>
        <button className="btn sm:col-span-2">Guardar perfil</button>
      </form>
    </main>
  );
}
