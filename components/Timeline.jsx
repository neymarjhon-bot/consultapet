'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fmtDate } from '@/lib/utils';

export default function Timeline({ petId }) {
  const [groups, setGroups] = useState(null);
  useEffect(() => {
    (async () => {
      const [v, m, w, x] = await Promise.all([
        supabase.from('vaccination_status').select('*').eq('pet_id', petId),
        supabase.from('medical_records').select('*').eq('pet_id', petId),
        supabase.from('weight_logs').select('*').eq('pet_id', petId),
        supabase.from('exercise_logs').select('*').eq('pet_id', petId)
      ]);
      const ev = [
        ...(v.data || []).map((r) => ({ d: r.applied_date || r.scheduled_date, ico: '💉', t: `Vacuna ${r.vaccine_name}`, s: r.applied_date ? `Aplicada${r.batch_number ? ' · lote ' + r.batch_number : ''}` : 'Pendiente' })),
        ...(m.data || []).map((r) => ({ d: r.visit_date, ico: '🩺', t: `Consulta: ${r.reason || 'control'}`, s: r.diagnosis || '' })),
        ...(w.data || []).map((r) => ({ d: r.measured_on, ico: '⚖️', t: `Peso ${r.weight_kg} kg`, s: r.notes || '' })),
        ...(x.data || []).map((r) => ({ d: r.performed_on, ico: '🏃', t: `${r.exercise_type} ${r.duration_min} min`, s: r.intensity }))
      ].filter((e) => e.d).sort((a, b) => (a.d < b.d ? 1 : -1));
      const g = {};
      ev.forEach((e) => { const y = e.d.slice(0, 4); (g[y] = g[y] || []).push(e); });
      setGroups(Object.entries(g).sort((a, b) => b[0] - a[0]));
    })();
  }, [petId]);

  if (!groups) return <p className="text-stone-500">Cargando…</p>;
  if (!groups.length) return <div className="card text-sm text-stone-500">Aún no hay eventos en el historial.</div>;
  return (
    <div className="space-y-4">
      {groups.map(([year, items]) => (
        <section key={year} className="card">
          <h3 className="mb-2 text-lg font-bold text-brand-700">{year}</h3>
          <ul className="space-y-2 border-l-2 border-brand-100 pl-4">
            {items.map((e, i) => (
              <li key={i} className="text-sm">
                <span className="mr-2 text-xs text-stone-500">{fmtDate(e.d)}</span>{e.ico} <strong>{e.t}</strong>
                {e.s && <span className="text-stone-500"> — {e.s}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
