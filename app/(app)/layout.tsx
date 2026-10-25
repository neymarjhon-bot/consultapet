import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import SignOut from '@/components/SignOut';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin } = await requireProfile();
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand">ConsultaPet</Link>
        <nav aria-label="Principal">
          <Link href="/">{isAdmin ? 'Todas las mascotas' : 'Mis mascotas'}</Link>
          <Link href="/pets/new">Nueva mascota</Link>
          <Link href="/profile">Mi perfil</Link>
          {isAdmin && <Link href="/admin">Administración</Link>}
        </nav>
        <div className="who">
          <b>{profile.full_name || profile.email}</b>
          {isAdmin ? 'Administrador veterinario' : 'Dueño'}
          <div><SignOut /></div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
