import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyVaccine, type NoticeKind } from '@/lib/email';
import { addDays } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Tarea diaria (Vercel Cron): envía recordatorios 7 días y 1 día antes de cada vacuna pendiente.
// Vercel envía el encabezado "Authorization: Bearer <CRON_SECRET>"; sin él, la ruta responde 401.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const supabase = createAdminClient();
  const plan: [number, NoticeKind][] = [[7, 'vaccine_7d'], [1, 'vaccine_1d']];
  const result: Record<string, { revisadas: number; enviadas: number; fallidas: number }> = {};

  for (const [days, kind] of plan) {
    const date = addDays(days);
    const { data: due } = await supabase
      .from('vaccinations')
      .select('id, pets!inner(deleted_at)')
      .is('applied_date', null)
      .is('pets.deleted_at', null)
      .eq('scheduled_date', date);
    const { data: done } = await supabase.from('notifications').select('vaccination_id').eq('kind', kind)
      .in('vaccination_id', (due ?? []).map((v: any) => v.id));
    const already = new Set((done ?? []).map((n: any) => n.vaccination_id));
    const r = { revisadas: due?.length ?? 0, enviadas: 0, fallidas: 0 };
    for (const v of due ?? []) {
      if (already.has(v.id)) continue;
      const s = await notifyVaccine(supabase, v.id, kind);
      if (s === 'sent') r.enviadas++; else if (s === 'failed') r.fallidas++;
    }
    result[kind] = r;
  }
  return NextResponse.json({ ok: true, fecha: addDays(0), ...result });
}
