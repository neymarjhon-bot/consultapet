import type { SupabaseClient } from "@supabase/supabase-js";
import { SPECIES, SEX, STAGE, INTENSITY, KIND } from "@/lib/labels";

export type Section = { title: string; columns: string[]; rows: string[][] };
const v = (x: any) => (x === null || x === undefined ? "" : String(x));

export async function loadHistory(supabase: SupabaseClient, petId: string) {
  const q = (t: string, sel: string, order: string) =>
    supabase.from(t).select(sel).eq("pet_id", petId).order(order);
  const [pet, vacc, rec, med, all, plans, prefs, wt, ex] = await Promise.all([
    supabase.from("pets").select("*,breeds(name),profiles(full_name)").eq("id", petId).maybeSingle(),
    q("vaccinations", "*,vaccine_types(name)", "scheduled_date"),
    q("medical_records", "*", "visit_date"),
    q("medications", "*", "start_date"),
    q("allergies", "*", "allergen"),
    q("feeding_plans", "*", "start_date"),
    q("food_preferences", "*", "kind"),
    q("weight_logs", "*", "measured_on"),
    q("exercise_logs", "*", "performed_on"),
  ]);
  return {
    pet: pet.data as any, vacc: (vacc.data ?? []) as any[], rec: (rec.data ?? []) as any[],
    med: (med.data ?? []) as any[], all: (all.data ?? []) as any[], plans: (plans.data ?? []) as any[],
    prefs: (prefs.data ?? []) as any[], wt: (wt.data ?? []) as any[], ex: (ex.data ?? []) as any[],
  };
}
export type History = Awaited<ReturnType<typeof loadHistory>>;

export function toEvents(h: History) {
  const ev: { date: string; kind: string; text: string }[] = [];
  h.vacc.forEach((x) => ev.push({
    date: x.applied_date ?? x.scheduled_date, kind: "Vacuna",
    text: `${x.vaccine_types?.name ?? ""}: ${x.applied_date ? "aplicada" : "programada, sin aplicar"}${x.batch_number ? `, lote ${x.batch_number}` : ""}`,
  }));
  h.rec.forEach((x) => ev.push({ date: x.visit_date, kind: "Consulta", text: [x.reason, x.diagnosis, x.treatment].filter(Boolean).join(". ") }));
  h.med.filter((x) => x.start_date).forEach((x) => ev.push({ date: x.start_date, kind: "Medicamento", text: [x.name, x.dose, x.frequency].filter(Boolean).join(", ") }));
  h.all.filter((x) => x.detected_on).forEach((x) => ev.push({ date: x.detected_on, kind: "Alergia", text: `${x.allergen}${x.reaction ? `: ${x.reaction}` : ""}` }));
  h.plans.filter((x) => x.start_date).forEach((x) => ev.push({ date: x.start_date, kind: "Alimentación", text: `Plan ${STAGE[x.stage] ?? x.stage}${x.brand ? `, ${x.brand}` : ""}${x.daily_grams ? `, ${x.daily_grams} g/día` : ""}` }));
  h.wt.forEach((x) => ev.push({ date: x.measured_on, kind: "Peso", text: `${x.weight_kg} kg` }));
  h.ex.forEach((x) => ev.push({ date: x.performed_on, kind: "Ejercicio", text: `${x.exercise_type}, ${x.duration_min} min, intensidad ${INTENSITY[x.intensity] ?? x.intensity}` }));
  return ev.sort((a, b) => b.date.localeCompare(a.date));
}

export function toSections(h: History, year?: string): Section[] {
  const inYear = (d?: string | null) => !year || (d ?? "").startsWith(year);
  const p = h.pet;
  return [
    { title: "Datos", columns: ["Campo", "Valor"], rows: [
      ["Nombre", v(p.name)], ["Especie", SPECIES[p.species] ?? v(p.species)], ["Raza", v(p.breeds?.name ?? p.breed_other)],
      ["Sexo", SEX[p.sex] ?? v(p.sex)], ["Nacimiento", v(p.birth_date)], ["Lugar", v(p.birth_place)],
      ["Color", v(p.color)], ["Microchip", v(p.microchip)], ["Dueño", v(p.profiles?.full_name)],
    ] },
    { title: "Vacunas", columns: ["Vacuna", "Programada", "Aplicada", "Veterinario", "Lote", "Observaciones"],
      rows: h.vacc.filter((x) => inYear(x.scheduled_date)).map((x) => [v(x.vaccine_types?.name), v(x.scheduled_date), v(x.applied_date), v(x.vet_name_text), v(x.batch_number), v(x.observations)]) },
    { title: "Consultas", columns: ["Fecha", "Clínica", "Motivo", "Diagnóstico", "Tratamiento", "Notas"],
      rows: h.rec.filter((x) => inYear(x.visit_date)).map((x) => [v(x.visit_date), v(x.clinic), v(x.reason), v(x.diagnosis), v(x.treatment), v(x.notes)]) },
    { title: "Medicamentos", columns: ["Nombre", "Dosis", "Frecuencia", "Inicio", "Fin", "Notas"],
      rows: h.med.filter((x) => inYear(x.start_date)).map((x) => [v(x.name), v(x.dose), v(x.frequency), v(x.start_date), v(x.end_date), v(x.notes)]) },
    { title: "Alergias", columns: ["Alérgeno", "Reacción", "Gravedad", "Detectada"],
      rows: h.all.map((x) => [v(x.allergen), v(x.reaction), v(x.severity), v(x.detected_on)]) },
    { title: "Alimentación", columns: ["Etapa", "Tipo", "Marca", "g/día", "Comidas/día", "Horario", "Inicio", "Fin"],
      rows: h.plans.filter((x) => inYear(x.start_date)).map((x) => [STAGE[x.stage] ?? v(x.stage), v(x.food_type), v(x.brand), v(x.daily_grams), v(x.meals_per_day), v(x.schedule), v(x.start_date), v(x.end_date)]) },
    { title: "Favoritas y restricciones", columns: ["Tipo", "Descripción"],
      rows: h.prefs.map((x) => [KIND[x.kind] ?? v(x.kind), v(x.description)]) },
    { title: "Peso", columns: ["Fecha", "Peso (kg)", "Notas"],
      rows: h.wt.filter((x) => inYear(x.measured_on)).map((x) => [v(x.measured_on), v(x.weight_kg), v(x.notes)]) },
    { title: "Ejercicio", columns: ["Fecha", "Actividad", "Minutos", "Intensidad", "Notas"],
      rows: h.ex.filter((x) => inYear(x.performed_on)).map((x) => [v(x.performed_on), v(x.exercise_type), v(x.duration_min), INTENSITY[x.intensity] ?? v(x.intensity), v(x.notes)]) },
  ];
}
