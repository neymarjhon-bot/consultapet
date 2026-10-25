'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function Login() {
  const [mode, setMode] = useState('in');
  const [f, setF] = useState({ email: '', password: '', full_name: '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    const sb = supabaseBrowser();
    const { error } = mode === 'in'
      ? await sb.auth.signInWithPassword({ email: f.email, password: f.password })
      : await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.full_name } } });
    if (error) return setMsg(error.message);
    if (mode === 'up') {
      const { data } = await sb.auth.getSession();
      if (!data.session) return setMsg('Cuenta creada. Revisa tu correo para confirmarla.');
    }
    window.location.href = '/';
  }

  return (
    <div className="card" style={{ maxWidth: 380, margin: '60px auto' }}>
      <h2>🐾 ConsultaPet</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        {mode === 'up' && <div><label>Nombre completo</label><input required value={f.full_name} onChange={set('full_name')} /></div>}
        <div><label>Correo</label><input type="email" required value={f.email} onChange={set('email')} /></div>
        <div><label>Contraseña</label><input type="password" minLength={8} required value={f.password} onChange={set('password')} /></div>
        <button>{mode === 'in' ? 'Entrar' : 'Registrarme como dueño'}</button>
        {msg && <p className="err">{msg}</p>}
      </form>
      <p className="mut">
        {mode === 'in' ? '¿Sin cuenta? ' : '¿Ya tienes cuenta? '}
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'in' ? 'up' : 'in'); }}>
          {mode === 'in' ? 'Regístrate' : 'Inicia sesión'}
        </a>
      </p>
    </div>
  );
}
