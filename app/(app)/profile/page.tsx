import { requireProfile, ROLE_LABEL } from '@/lib/auth';
import { updateProfile } from '@/app/actions';
import Flash from '@/components/Flash';

export default async function Profile({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase, user, profile, role, isOwner } = await requireProfile();
  const { data: pref } = isOwner
    ? await supabase.from('notification_preferences').select('*').eq('owner_id', user.id).maybeSingle()
    : { data: null as any };
  const on = (k: string) => (pref ? pref[k] !== false : true);
  return (
    <>
      <div className="head"><div><h1>Mi perfil</h1><p className="sub">{profile.email} · {ROLE_LABEL[role]}</p></div></div>
      <Flash error={sp.error} ok={sp.ok} />
      <form action={updateProfile} className="card f">
        <label>Nombre completo<input name="full_name" defaultValue={profile.full_name} required /></label>
        <label>Teléfono<input name="phone" defaultValue={profile.phone ?? ''} autoComplete="tel" /></label>
        <label className="wide">Dirección<input name="address_line" defaultValue={profile.address_line ?? ''} /></label>
        <label>Ciudad<input name="city" defaultValue={profile.city ?? ''} /></label>
        <label>Región<input name="region" defaultValue={profile.region ?? ''} /></label>
        {isOwner && (
          <fieldset className="wide" style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '.8rem 1rem' }}>
            <legend style={{ fontWeight: 700, color: 'var(--brand)', padding: '0 .3rem' }}>Avisos por correo</legend>
            {[['email_enabled', 'Acepto recibir avisos por correo sobre las vacunas de mis mascotas (agendamiento y próxima dosis).'],
              ['remind_7d', 'Recordatorio 7 días antes de cada vacuna.'],
              ['remind_1d', 'Recordatorio 1 día antes de cada vacuna.']].map(([k, label]) => (
              <label key={k} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', fontWeight: 500, color: 'var(--ink)', marginTop: '.3rem' }}>
                <input type="checkbox" name={k} defaultChecked={on(k)} style={{ width: 'auto', marginTop: '.25rem' }} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        )}
        <div className="wide"><button className="btn">Guardar cambios</button></div>
      </form>
    </>
  );
}
