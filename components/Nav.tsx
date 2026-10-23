import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'

export default async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let name = ''
  let isAdmin = false
  if (user) {
    const { data: p } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
    name = p?.full_name || user.email || ''
    isAdmin = p?.role === 'admin' || p?.role === 'vet'
  }
  return (
    <header className="border-b border-pine-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-pine-700">ConsultaPet</Link>
        {user && (
          <>
            <Link href="/" className="text-sm text-pine-700 hover:underline">Mascotas</Link>
            {isAdmin && <Link href="/admin" className="text-sm text-pine-700 hover:underline">Administración</Link>}
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm sm:inline">{name}</span>
              <span className="rounded-full bg-pine-50 px-2 py-0.5 text-xs text-pine-700">{isAdmin ? 'Administrador veterinario' : 'Dueño'}</span>
              <form action={logout}><button className="btn-ghost">Salir</button></form>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
