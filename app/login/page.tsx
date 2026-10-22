import { login, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const sp = await searchParams
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold">Todo el historial de tu mascota en un solo lugar</h1>
      <p className="mb-6 text-sm text-pine-700">Vacunas, consultas, alimentación y peso, ordenados por año.</p>
      {sp.error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-brick-600">{sp.error}</p>}
      {sp.message && <p className="mb-4 rounded-lg bg-pine-50 p-3 text-sm text-pine-700">{sp.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <form action={login} className="card space-y-3">
          <h2 className="font-semibold">Iniciar sesión</h2>
          <div><label className="label" htmlFor="le">Correo</label><input id="le" name="email" type="email" required className="input" /></div>
          <div><label className="label" htmlFor="lp">Contraseña</label><input id="lp" name="password" type="password" required className="input" /></div>
          <button className="btn w-full">Entrar</button>
        </form>
        <form action={signup} className="card space-y-3">
          <h2 className="font-semibold">Crear cuenta de dueño</h2>
          <div><label className="label" htmlFor="sn">Nombre completo</label><input id="sn" name="full_name" required className="input" /></div>
          <div><label className="label" htmlFor="se">Correo</label><input id="se" name="email" type="email" required className="input" /></div>
          <div><label className="label" htmlFor="sp">Contraseña (mínimo 6)</label><input id="sp" name="password" type="password" minLength={6} required className="input" /></div>
          <button className="btn-ghost w-full">Registrarme</button>
        </form>
      </div>
    </div>
  )
}
