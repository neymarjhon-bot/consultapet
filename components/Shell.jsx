'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';
import { ROLE_LABEL } from '@/lib/utils';

export default function Shell({ children, roles }) {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!loading && !session) router.replace('/');
  }, [loading, session, router]);

  if (loading || !session || !profile) return <div className="p-10 text-center text-stone-500">Cargando…</div>;
  if (roles && !roles.includes(profile.role)) {
    return <div className="p-10 text-center">No tienes permiso para ver esta página. <Link className="underline" href="/dashboard">Volver</Link></div>;
  }

  const link = (href, label) => (
    <Link href={href} className={`rounded-md px-3 py-1.5 text-sm ${path.startsWith(href) ? 'bg-brand-100 text-brand-700 font-medium' : 'text-stone-600 hover:bg-stone-100'}`}>
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2">
          <Link href="/dashboard" className="mr-2 text-lg font-bold text-brand-700">🐾 PetManager</Link>
          {link('/dashboard', 'Panel')}
          {link('/profile', 'Mi perfil')}
          {profile.role === 'admin' && link('/admin', 'Administración')}
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-stone-500 sm:inline">{profile.full_name || profile.email} · {ROLE_LABEL[profile.role]}</span>
            <button className="btn-ghost" onClick={async () => { await supabase.auth.signOut(); router.replace('/'); }}>Salir</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
