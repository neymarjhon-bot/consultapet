'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'err' | 'ok'; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email')), password = String(fd.get('password'));
    const supabase = createClient();
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ t: 'err', text: error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message });
      else { router.replace('/'); router.refresh(); }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: String(fd.get('full_name') || '') }, emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) setMsg({ t: 'err', text: error.message });
      else if (data.session) { router.replace('/'); router.refresh(); }
      else setMsg({ t: 'ok', text: 'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.' });
    }
    setBusy(false);
  }

  return (
    <main className="login">
      <div className="card">
        <h1 style={{ color: 'var(--brand)' }}>ConsultaPet</h1>
        <p className="sub">{mode === 'login' ? 'Ingresa para ver el historial de tus mascotas.' : 'Crea tu cuenta de dueño y registra a tus mascotas.'}</p>
        <form onSubmit={submit} className="f" style={{ gridTemplateColumns: '1fr' }}>
          {mode === 'register' && <label>Nombre completo<input name="full_name" required autoComplete="name" /></label>}
          <label>Correo<input name="email" type="email" required autoComplete="email" /></label>
          <label>Contraseña<input name="password" type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {msg && <div className={`flash ${msg.t === 'err' ? 'err' : 'ok'}`} role="alert">{msg.text}</div>}
          <button className="btn" disabled={busy}>{busy ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          {mode === 'login' ? '¿Aún no tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <a href="#" onClick={(e) => { e.preventDefault(); setMsg(null); setMode(mode === 'login' ? 'register' : 'login'); }}>
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </a>
        </p>
      </div>
    </main>
  );
}
