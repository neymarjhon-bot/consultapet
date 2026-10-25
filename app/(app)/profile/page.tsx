import { requireProfile } from '@/lib/auth';
import { updateProfile } from '@/app/actions';
import Flash from '@/components/Flash';

export default async function Profile({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { profile, isAdmin } = await requireProfile();
  return (
    <>
      <div className="head"><div><h1>Mi perfil</h1><p className="sub">{profile.email} · {isAdmin ? 'Administrador veterinario' : 'Dueño'}</p></div></div>
      <Flash error={sp.error} ok={sp.ok} />
      <form action={updateProfile} className="card f">
        <label>Nombre completo<input name="full_name" defaultValue={profile.full_name} required /></label>
        <label>Teléfono<input name="phone" defaultValue={profile.phone ?? ''} autoComplete="tel" /></label>
        <label className="wide">Dirección<input name="address_line" defaultValue={profile.address_line ?? ''} /></label>
        <label>Ciudad<input name="city" defaultValue={profile.city ?? ''} /></label>
        <label>Región<input name="region" defaultValue={profile.region ?? ''} /></label>
        <label>País<input name="country" defaultValue={profile.country ?? 'CL'} /></label>
        <div className="wide"><button className="btn">Guardar cambios</button></div>
      </form>
    </>
  );
}
