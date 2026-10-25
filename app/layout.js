import './globals.css';
import { getSession } from '@/lib/supabase/server';

export const metadata = { title: 'ConsultaPet', description: 'Gestión de mascotas' };

const ROLES = { owner: 'Dueño', admin: 'Administrador veterinario' };

export default async function RootLayout({ children }) {
  const { profile } = await getSession();
  return (
    <html lang="es">
      <body>
        {profile && (
          <header>
            <strong>🐾 ConsultaPet</strong>
            <a href="/">Mascotas</a>
            {profile.role === 'owner' && <a href="/pets/new">+ Nueva mascota</a>}
            {profile.role === 'admin' && <a href="/admin">Administración</a>}
            <span className="sp" />
            <span className="mut">{profile.full_name || profile.email} · {ROLES[profile.role]}</span>
            <form action="/auth/signout" method="post"><button className="ghost">Salir</button></form>
          </header>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
