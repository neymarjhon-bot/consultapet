import { getSession } from '@/lib/supabase/server';

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export async function GET(_req, { params }) {
  const { sb, user } = await getSession();
  if (!user) return new Response('No autorizado', { status: 401 });
  const id = params.id;
  const { data: pet } = await sb.from('pets').select('name').eq('id', id).single();
  if (!pet) return new Response('No encontrado', { status: 404 });
  const sections = [
    ['Vacunas', 'vaccinations', ['scheduled_date', 'applied_date', 'vet_name_text', 'batch_number', 'observations']],
    ['Consultas', 'medical_records', ['visit_date', 'clinic', 'reason', 'diagnosis', 'treatment']],
    ['Medicamentos', 'medications', ['name', 'dose', 'frequency', 'start_date', 'end_date']],
    ['Alergias', 'allergies', ['allergen', 'reaction', 'severity']],
    ['Alimentacion', 'feeding_plans', ['stage', 'food_type', 'brand', 'daily_grams', 'meals_per_day', 'schedule']],
    ['Peso', 'weight_logs', ['measured_on', 'weight_kg', 'notes']],
    ['Ejercicio', 'exercise_logs', ['performed_on', 'exercise_type', 'duration_min', 'intensity']],
  ];
  let out = `\uFEFFHistorial de ${pet.name}\n`;
  for (const [title, table, cols] of sections) {
    const { data } = await sb.from(table).select(cols.join(',')).eq('pet_id', id);
    out += `\n${title}\n${cols.join(',')}\n`;
    (data || []).forEach((r) => (out += cols.map((c) => esc(r[c])).join(',') + '\n'));
  }
  return new Response(out, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="historial-${pet.name}.csv"` },
  });
}
