import * as XLSX from 'xlsx';
import { supabase } from './supabase';

const TABLES = [
  ['Vacunas', 'vaccination_status'], ['Consultas', 'medical_records'], ['Medicamentos', 'medications'],
  ['Alergias', 'allergies'], ['Plan alimentacion', 'feeding_plans'], 
  ['Preferencias', 'food_preferences'], ['Peso', 'weight_logs'], ['Ejercicio', 'exercise_logs']
];

export async function exportPetXlsx(pet) {
  const wb = XLSX.utils.book_new();
  const { breeds, ...p } = pet;
  p.raza = breeds?.name || p.breed_other || '';
  const { id, owner_id, ...pflat } = p;
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([pflat]), 'Mascota');
  for (const [sheet, table] of TABLES) {
    const { data } = await supabase.from(table).select('*').eq('pet_id', pet.id);
    const clean = (data || []).map(({ id, pet_id, created_by, vaccine_type_id, ...r }) => r);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clean.length ? clean : [{ info: 'Sin registros' }]), sheet);
  }
  XLSX.writeFile(wb, `historial_${pet.name}.xlsx`);
}
