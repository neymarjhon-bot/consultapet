import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SECTIONS, displayValue } from '@/lib/sections';

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('No autorizado', { status: 401 });
  const { data: pet } = await supabase.from('pets').select('name,birth_date,species').eq('id', id).maybeSingle();
  if (!pet) return new NextResponse('No encontrada', { status: 404 });
  const lines: string[] = [esc(`Historial de ${pet.name}`), ''];
  for (const s of Object.values(SECTIONS)) {
    const { data } = await supabase.from(s.table).select(s.select ?? '*').eq('pet_id', id).order(s.order, { ascending: false });
    lines.push(esc(s.title), s.cols.map((c) => esc(c.label)).join(';'));
    (data ?? []).forEach((r: any) => lines.push(s.cols.map((c) => esc(c.key === 'status' ? (r.applied_date ? 'Aplicada' : 'Pendiente') : displayValue(s, c.key, r))).join(';')));
    lines.push('');
  }
  return new NextResponse('\uFEFF' + lines.join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="historial-${pet.name.replace(/[^a-z0-9]/gi, '_')}.csv"` },
  });
}
