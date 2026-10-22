export type Field = {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea'
  required?: boolean
  step?: string
  options?: { value: string; label: string }[]
  optionsFrom?: 'vaccine_types'
}
export type Section = {
  key: string
  title: string
  hint?: string
  table: string
  select?: string
  order: string
  adminOnly?: boolean
  fields: Field[]
  cols: { label: string; get: (r: any) => string }[]
}

const today = () => new Date().toISOString().slice(0, 10)

export const SECTIONS: Record<string, Section> = {
  vaccinations: {
    key: 'vaccinations', title: 'Vacunas', table: 'vaccinations',
    hint: 'Calendario de vacunas. Deja vacía la fecha de aplicación si aún está pendiente.',
    select: '*, vaccine_types(name)', order: 'scheduled_date',
    fields: [
      { name: 'vaccine_type_id', label: 'Vacuna', type: 'select', optionsFrom: 'vaccine_types', required: true },
      { name: 'scheduled_date', label: 'Fecha programada', type: 'date', required: true },
      { name: 'applied_date', label: 'Fecha aplicada', type: 'date' },
      { name: 'vet_name_text', label: 'Veterinario', type: 'text' },
      { name: 'batch_number', label: 'Lote', type: 'text' },
      { name: 'observations', label: 'Observaciones', type: 'text' },
    ],
    cols: [
      { label: 'Vacuna', get: (r) => r.vaccine_types?.name ?? '—' },
      { label: 'Programada', get: (r) => r.scheduled_date },
      { label: 'Estado', get: (r) => r.applied_date ? `Aplicada ${r.applied_date}` : r.scheduled_date < today() ? 'Vencida' : 'Pendiente' },
      { label: 'Veterinario', get: (r) => r.vet_name_text ?? '' },
      { label: 'Lote', get: (r) => r.batch_number ?? '' },
    ],
  },
  medical_records: {
    key: 'medical_records', title: 'Consultas médicas', table: 'medical_records', adminOnly: true,
    hint: 'Las registra el administrador veterinario.', order: 'visit_date',
    fields: [
      { name: 'visit_date', label: 'Fecha', type: 'date', required: true },
      { name: 'clinic', label: 'Clínica', type: 'text' },
      { name: 'reason', label: 'Motivo', type: 'text' },
      { name: 'diagnosis', label: 'Diagnóstico', type: 'text' },
      { name: 'treatment', label: 'Tratamiento', type: 'text' },
      { name: 'notes', label: 'Notas', type: 'textarea' },
    ],
    cols: [
      { label: 'Fecha', get: (r) => r.visit_date },
      { label: 'Motivo', get: (r) => r.reason ?? '' },
      { label: 'Diagnóstico', get: (r) => r.diagnosis ?? '' },
      { label: 'Tratamiento', get: (r) => r.treatment ?? '' },
    ],
  },
  medications: {
    key: 'medications', title: 'Medicamentos', table: 'medications', adminOnly: true, order: 'start_date',
    fields: [
      { name: 'name', label: 'Medicamento', type: 'text', required: true },
      { name: 'dose', label: 'Dosis', type: 'text' },
      { name: 'frequency', label: 'Frecuencia', type: 'text' },
      { name: 'start_date', label: 'Inicio', type: 'date' },
      { name: 'end_date', label: 'Fin', type: 'date' },
      { name: 'notes', label: 'Notas', type: 'text' },
    ],
    cols: [
      { label: 'Medicamento', get: (r) => r.name },
      { label: 'Dosis', get: (r) => r.dose ?? '' },
      { label: 'Frecuencia', get: (r) => r.frequency ?? '' },
      { label: 'Periodo', get: (r) => [r.start_date, r.end_date].filter(Boolean).join(' → ') },
    ],
  },
  allergies: {
    key: 'allergies', title: 'Alergias', table: 'allergies', order: 'detected_on',
    fields: [
      { name: 'allergen', label: 'Alérgeno', type: 'text', required: true },
      { name: 'reaction', label: 'Reacción', type: 'text' },
      { name: 'severity', label: 'Gravedad', type: 'select', options: [{ value: 'leve', label: 'Leve' }, { value: 'moderada', label: 'Moderada' }, { value: 'grave', label: 'Grave' }] },
      { name: 'detected_on', label: 'Detectada el', type: 'date' },
    ],
    cols: [
      { label: 'Alérgeno', get: (r) => r.allergen },
      { label: 'Reacción', get: (r) => r.reaction ?? '' },
      { label: 'Gravedad', get: (r) => r.severity ?? '' },
      { label: 'Detectada', get: (r) => r.detected_on ?? '' },
    ],
  },
  feeding_plans: {
    key: 'feeding_plans', title: 'Plan de alimentación', table: 'feeding_plans', order: 'start_date',
    hint: 'Un plan por etapa de vida.',
    fields: [
      { name: 'stage', label: 'Etapa', type: 'select', required: true, options: [{ value: 'puppy', label: 'Cachorro' }, { value: 'adult', label: 'Adulto' }, { value: 'senior', label: 'Senior' }] },
      { name: 'food_type', label: 'Tipo de comida', type: 'text' },
      { name: 'brand', label: 'Marca', type: 'text' },
      { name: 'daily_grams', label: 'Gramos por día', type: 'number' },
      { name: 'meals_per_day', label: 'Comidas por día', type: 'number' },
      { name: 'schedule', label: 'Horarios', type: 'text' },
      { name: 'start_date', label: 'Desde', type: 'date' },
    ],
    cols: [
      { label: 'Etapa', get: (r) => ({ puppy: 'Cachorro', adult: 'Adulto', senior: 'Senior' } as any)[r.stage] ?? r.stage },
      { label: 'Comida', get: (r) => [r.food_type, r.brand].filter(Boolean).join(' · ') },
      { label: 'Porción', get: (r) => r.daily_grams ? `${r.daily_grams} g/día` : '' },
      { label: 'Horarios', get: (r) => r.schedule ?? '' },
    ],
  },
  food_preferences: {
    key: 'food_preferences', title: 'Favoritos y restricciones', table: 'food_preferences', order: 'kind',
    fields: [
      { name: 'kind', label: 'Tipo', type: 'select', required: true, options: [{ value: 'favorite', label: 'Comida favorita' }, { value: 'restriction', label: 'Restricción' }] },
      { name: 'description', label: 'Descripción', type: 'text', required: true },
    ],
    cols: [
      { label: 'Tipo', get: (r) => (r.kind === 'favorite' ? 'Favorita' : 'Restricción') },
      { label: 'Descripción', get: (r) => r.description },
    ],
  },
  weight_logs: {
    key: 'weight_logs', title: 'Registro de peso', table: 'weight_logs', order: 'measured_on',
    fields: [
      { name: 'measured_on', label: 'Fecha', type: 'date', required: true },
      { name: 'weight_kg', label: 'Peso (kg)', type: 'number', step: '0.01', required: true },
      { name: 'notes', label: 'Notas', type: 'text' },
    ],
    cols: [
      { label: 'Fecha', get: (r) => r.measured_on },
      { label: 'Peso', get: (r) => `${r.weight_kg} kg` },
      { label: 'Notas', get: (r) => r.notes ?? '' },
    ],
  },
  exercise_logs: {
    key: 'exercise_logs', title: 'Ejercicio', table: 'exercise_logs', order: 'performed_on',
    fields: [
      { name: 'performed_on', label: 'Fecha', type: 'date', required: true },
      { name: 'exercise_type', label: 'Tipo', type: 'text', required: true },
      { name: 'duration_min', label: 'Duración (min)', type: 'number', required: true },
      { name: 'intensity', label: 'Intensidad', type: 'select', options: [{ value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }] },
      { name: 'notes', label: 'Notas', type: 'text' },
    ],
    cols: [
      { label: 'Fecha', get: (r) => r.performed_on },
      { label: 'Tipo', get: (r) => r.exercise_type },
      { label: 'Duración', get: (r) => `${r.duration_min} min` },
      { label: 'Intensidad', get: (r) => ({ low: 'Baja', medium: 'Media', high: 'Alta' } as any)[r.intensity] ?? '' },
    ],
  },
}

export const TABS: Record<string, { label: string; sections: string[] }> = {
  salud: { label: 'Salud', sections: ['vaccinations', 'medical_records', 'medications', 'allergies'] },
  alimentacion: { label: 'Alimentación', sections: ['feeding_plans', 'food_preferences'] },
  crecimiento: { label: 'Crecimiento', sections: ['weight_logs', 'exercise_logs'] },
  historial: { label: 'Historial por año', sections: [] },
}
