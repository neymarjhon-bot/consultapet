import { createClient } from '@/lib/supabase/server'
import { SECTIONS } from '@/lib/sections'

const esc = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })
  const { data: pet } = await supabase.from('pets').select('name').eq('id', id).maybeSingle()
  if (!pet) return new Response('No encontrada', { status: 404 })

  const lines = [['Sección', ...['Dato 1', 'Dato 2', 'Dato 3', 'Dato 4', 'Dato 5']].map(esc).join(',')]
  for (const s of Object.values(SECTIONS)) {
    const { data } = await supabase.from(s.table).select(s.select ?? '*').eq('pet_id', id).order(s.order, { ascending: false })
    lines.push(esc(`== ${s.title} ==`) + ',' + s.cols.map((c) => esc(c.label)).join(','))
    ;((data ?? []) as any[]).forEach((r) => lines.push(esc(s.title) + ',' + s.cols.map((c) => esc(c.get(r))).join(',')))
  }
  const body = '\uFEFF' + lines.join('\r\n')
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="historial-${pet.name}.csv"`,
    },
  })
}
