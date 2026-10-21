'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function Login() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && session) router.replace('/dashboard'); }, [loading, session, router]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) setErr(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message);
    } else if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.name }, emailRedirectTo: window.location.origin }
      });
      if (error) setErr(error.message);
      else if (!data.session) setMsg('Cuenta creada. Revisa tu correo para confirmar tu cuenta y luego inicia sesión.');
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: window.location.origin });
      if (error) setErr(error.message); else setMsg('Te enviamos un correo para restablecer tu contraseña.');
    }
    setBusy(false);
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-stone-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-5xl">🐾</div>
          <h1 className="mt-2 text-2xl font-bold text-brand-700">PetManager</h1>
          <p className="text-sm text-stone-500">Todo el historial de tus mascotas en un solo lugar</p>
        </div>
        <form onSubmit={submit} className="card space-y-3">
          <h2 className="font-semibold">{mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña'}</h2>
          {mode === 'register' && (
            <div><label className="label">Nombre completo</label><input className="input" required value={form.name} onChange={set('name')} /></div>
          )}
          <div><label className="label">Correo</label><input type="email" className="input" required value={form.email} onChange={set('email')} /></div>
          {mode !== 'reset' && (
            <div><label className="label">Contraseña</label><input type="password" className="input" required minLength={8} value={form.password} onChange={set('password')} /></div>
          )}
          {err && <p className="rounded bg-red-50 p-2 text-xs text-red-700">{err}</p>}
          {msg && <p className="rounded bg-green-50 p-2 text-xs text-green-800">{msg}</p>}
          <button className="btn w-full" disabled={busy}>{busy ? 'Procesando…' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Registrarme' : 'Enviar correo'}</button>
          <div className="flex justify-between text-xs text-brand-700">
            {mode === 'login' ? (
              <>
                <button type="button" className="hover:underline" onClick={() => { setMode('register'); setErr(''); setMsg(''); }}>Crear cuenta</button>
                <button type="button" className="hover:underline" onClick={() => { setMode('reset'); setErr(''); setMsg(''); }}>Olvidé mi contraseña</button>
              </>
            ) : (
              <button type="button" className="hover:underline" onClick={() => { setMode('login'); setErr(''); setMsg(''); }}>← Volver a iniciar sesión</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
