export type Field = {
  name: string; label: string; type: 'text' | 'date' | 'number' | 'textarea' | 'select';
  options?: { value: string; label: string }[]; optionsFrom?: 'vaccine_types'; required?: boolean; step?: string;
};
export type Section = {
  key: string; tab: string; title: string; table: string; adminOnly?: boolean; order: string; select?: string;
  fields: Field[]; cols: { key: string; label: string }[]; empty: string;
};

const stage = [{ value: 'puppy', label: 'Cachorro' }, { value: 'adult', label: 'Adulto' }, { value: 'senior', label: 'Senior' }];
const intensity = [{ value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }];
const kind = [{ value: 'favorite', label: 'Favorita' }, { value: 'restriction', label: 'Restricción' }];
const severity = [{ value: 'leve', label: 'Leve' }, { value: 'moderada', label: 'Moderada' }, { value: 'grave', label: 'Grave' }];

export const SECTIONS: Record<string, Section> = {
  vaccinations: {
    key: 'vaccinations', tab: 'vacunas', title: 'Calendario de vacunas', table: 'vaccinations',
    order: 'scheduled_date', select: '*, vaccine_types(name)',
    empty: 'Aún no hay vacunas programadas. Agrega la primera para activar los recordatorios.',
    fields: [
      { name: 'vaccine_type_id', label: 'Vacuna', type: 'select', optionsFrom: 'vaccine_types', required: true },
      { name: 'scheduled_date', label: 'Fecha programada', type: 'date', required: true },
      { name: 'applied_date', label: 'Fecha aplicada', type: 'date' },
      { name: 'vet_name_text', label: 'Veterinario', type: 'text' },
      { name: 'batch_number', label: 'Lote', type: 'text' },
      { name: 'observations', label: 'Observaciones', type: 'textarea' },
    ],
    cols: [{ key: 'vaccine_types.name', label: 'Vacuna' }, { key: 'scheduled_date', label: 'Programada' }, { key: 'applied_date', label: 'Aplicada' },
      { key: 'status', label: 'Estado' }, { key: 'vet_name_text', label: 'Veterinario' }, { key: 'batch_number', label: 'Lote' }],
  },
  medical_records: {
    key: 'medical_records', tab: 'salud', title: 'Consultas y diagnósticos', table: 'medical_records', adminOnly: true, order: 'visit_date',
    empty: 'Sin consultas registradas. Solo el equipo veterinario puede agregarlas.',
    fields: [
      { name: 'visit_date', label: 'Fecha de consulta', type: 'date', required: true },
      { name: 'clinic', label: 'Clínica', type: 'text' },
      { name: 'reason', label: 'Motivo', type: 'text' },
      { name: 'diagnosis', label: 'Diagnóstico', type: 'textarea' },
      { name: 'treatment', label: 'Tratamiento', type: 'textarea' },
      { name: 'notes', label: 'Notas', type: 'textarea' },
    ],
    cols: [{ key: 'visit_date', label: 'Fecha' }, { key: 'clinic', label: 'Clínica' }, { key: 'reason', label: 'Motivo' }, { key: 'diagnosis', label: 'Diagnóstico' }, { key: 'treatment', label: 'Tratamiento' }],
  },
  medications: {
    key: 'medications', tab: 'salud', title: 'Medicamentos', table: 'medications', adminOnly: true, order: 'start_date',
    empty: 'Sin medicamentos registrados.',
    fields: [
      { name: 'name', label: 'Medicamento', type: 'text', required: true },
      { name: 'dose', label: 'Dosis', type: 'text' },
      { name: 'frequency', label: 'Frecuencia', type: 'text' },
      { name: 'start_date', label: 'Inicio', type: 'date' },
      { name: 'end_date', label: 'Término', type: 'date' },
      { name: 'notes', label: 'Notas', type: 'textarea' },
    ],
    cols: [{ key: 'name', label: 'Medicamento' }, { key: 'dose', label: 'Dosis' }, { key: 'frequency', label: 'Frecuencia' }, { key: 'start_date', label: 'Inicio' }, { key: 'end_date', label: 'Término' }],
  },
  allergies: {
    key: 'allergies', tab: 'salud', title: 'Alergias', table: 'allergies', order: 'detected_on',
    empty: 'Sin alergias registradas.',
    fields: [
      { name: 'allergen', label: 'Alérgeno', type: 'text', required: true },
      { name: 'reaction', label: 'Reacción', type: 'text' },
      { name: 'severity', label: 'Severidad', type: 'select', options: severity },
      { name: 'detected_on', label: 'Detectada el', type: 'date' },
    ],
    cols: [{ key: 'allergen', label: 'Alérgeno' }, { key: 'reaction', label: 'Reacción' }, { key: 'severity', label: 'Severidad' }, { key: 'detected_on', label: 'Detectada' }],
  },
  feeding_plans: {
    key: 'feeding_plans', tab: 'alimentacion', title: 'Plan de alimentación por etapa', table: 'feeding_plans', order: 'start_date',
    empty: 'Sin plan de alimentación. Define uno por etapa de vida.',
    fields: [
      { name: 'stage', label: 'Etapa', type: 'select', options: stage, required: true },
      { name: 'food_type', label: 'Tipo de comida', type: 'text' },
      { name: 'brand', label: 'Marca', type: 'text' },
      { name: 'daily_grams', label: 'Gramos por día', type: 'number', step: '1' },
      { name: 'meals_per_day', label: 'Comidas por día', type: 'number', step: '1' },
      { name: 'schedule', label: 'Horarios', type: 'text' },
      { name: 'start_date', label: 'Desde', type: 'date' },
      { name: 'end_date', label: 'Hasta', type: 'date' },
      { name: 'notes', label: 'Notas', type: 'textarea' },
    ],
    cols: [{ key: 'stage', label: 'Etapa' }, { key: 'food_type', label: 'Tipo' }, { key: 'brand', label: 'Marca' }, { key: 'daily_grams', label: 'g/día' }, { key: 'meals_per_day', label: 'Comidas' }, { key: 'schedule', label: 'Horarios' }],
  },
  food_preferences: {
    key: 'food_preferences', tab: 'alimentacion', title: 'Favoritas y restricciones', table: 'food_preferences', order: 'kind',
    empty: 'Sin preferencias registradas.',
    fields: [
      { name: 'kind', label: 'Tipo', type: 'select', options: kind, required: true },
      { name: 'description', label: 'Descripción', type: 'text', required: true },
    ],
    cols: [{ key: 'kind', label: 'Tipo' }, { key: 'description', label: 'Descripción' }],
  },
  weight_logs: {
    key: 'weight_logs', tab: 'peso', title: 'Registros de peso', table: 'weight_logs', order: 'measured_on',
    empty: 'Aún no hay pesajes. Registra el primero para ver la curva de crecimiento.',
    fields: [
      { name: 'measured_on', label: 'Fecha', type: 'date', required: true },
      { name: 'weight_kg', label: 'Peso (kg)', type: 'number', step: '0.01', required: true },
      { name: 'notes', label: 'Notas', type: 'text' },
    ],
    cols: [{ key: 'measured_on', label: 'Fecha' }, { key: 'weight_kg', label: 'Peso (kg)' }, { key: 'notes', label: 'Notas' }],
  },
  exercise_logs: {
    key: 'exercise_logs', tab: 'ejercicio', title: 'Registro de ejercicio', table: 'exercise_logs', order: 'performed_on',
    empty: 'Sin actividad registrada.',
    fields: [
      { name: 'performed_on', label: 'Fecha', type: 'date', required: true },
      { name: 'exercise_type', label: 'Tipo de ejercicio', type: 'text', required: true },
      { name: 'duration_min', label: 'Duración (min)', type: 'number', step: '1', required: true },
      { name: 'intensity', label: 'Intensidad', type: 'select', options: intensity },
      { name: 'notes', label: 'Notas', type: 'text' },
    ],
    cols: [{ key: 'performed_on', label: 'Fecha' }, { key: 'exercise_type', label: 'Ejercicio' }, { key: 'duration_min', label: 'Minutos' }, { key: 'intensity', label: 'Intensidad' }, { key: 'notes', label: 'Notas' }],
  },
};

export const TABS = [
  { key: 'resumen', label: 'Resumen', sections: [] as string[] },
  { key: 'vacunas', label: 'Vacunas', sections: ['vaccinations'] },
  { key: 'salud', label: 'Salud', sections: ['medical_records', 'medications', 'allergies'] },
  { key: 'alimentacion', label: 'Alimentación', sections: ['feeding_plans', 'food_preferences'] },
  { key: 'peso', label: 'Peso', sections: ['weight_logs'] },
  { key: 'ejercicio', label: 'Ejercicio', sections: ['exercise_logs'] },
];

const labelMaps: Record<string, string> = {};
export function displayValue(section: Section, key: string, row: any): string {
  const v = key.split('.').reduce((o: any, k) => (o ? o[k] : undefined), row);
  if (v === null || v === undefined || v === '') return '—';
  const f = section.fields.find((x) => x.name === key);
  const opt = f?.options?.find((o) => o.value === v);
  if (opt) return opt.label;
  return String(v);
}
