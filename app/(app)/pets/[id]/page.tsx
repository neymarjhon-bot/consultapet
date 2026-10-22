import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadHistory, toEvents } from "@/lib/history";
import { SPECIES, SEX, STAGE, INTENSITY, KIND } from "@/lib/labels";
import { updatePet, archivePet, uploadPhoto, grantVet, revokeVet } from "@/app/actions";
import { Item, RecordForm, Empty, Lbl } from "@/components/ui";
import Note from "@/components/SubmitNote";
import WeightChart from "@/components/WeightChart";

const TABS: [string, string][] = [
  ["resumen", "Resumen"], ["vacunas", "Vacunas"], ["salud", "Salud"], ["alimentacion", "Alimentación"],
  ["crecimiento", "Crecimiento"], ["historial", "Historial"], ["veterinarios", "Veterinarios"], ["exportar", "Exportar"],
];

export default async function PetPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  const { id } = await params;
  const { tab = "resumen", error } = await searchParams;
  const { supabase, user, profile } = await requireUser();
  const h = await loadHistory(supabase, id);
  const pet = h.pet;
  if (!pet || pet.deleted_at) notFound();

  const isOwner = pet.owner_id === user.id || profile.role === "admin";
  const canHealth = isOwner || profile.role === "vet";
  const today = new Date().toISOString().slice(0, 10);
  const tabs = TABS.filter(([k]) => k !== "veterinarios" || isOwner);

  let photoUrl: string | null = null;
  if (tab === "resumen" && pet.photo_path && pet.owner_id === user.id) {
    const s = await supabase.storage.from("pet-photos").createSignedUrl(pet.photo_path, 3600);
    photoUrl = s.data?.signedUrl ?? null;
  }

  return (
    <main className="space-y-6">
      <header>
        <Link href={profile.role === "vet" ? "/vet" : "/pets"} className="text-sm underline">Volver</Link>
        <h1 className="text-4xl font-extrabold text-pine mt-2">{pet.name}</h1>
        <p className="text-ink/70">
          {SPECIES[pet.species]}, {pet.breeds?.name ?? pet.breed_other ?? "sin raza"}{pet.birth_date ? `, nació el ${pet.birth_date}` : ""}
        </p>
      </header>

      <nav aria-label="Secciones" className="flex gap-1 overflow-x-auto border-b border-[#c9d6d1]">
        {tabs.map(([k, label]) => (
          <Link key={k} href={`/pets/${id}?tab=${k}`} aria-current={tab === k ? "page" : undefined}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${tab === k ? "border-pine font-bold" : "border-transparent text-ink/70"}`}>
            {label}
          </Link>
        ))}
      </nav>

      {tab === "resumen" && (
        <section className="space-y-6">
          {photoUrl && <img src={photoUrl} alt={`Foto de ${pet.name}`} className="w-48 h-48 object-cover rounded-md" />}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm bg-white p-4 rounded-md border border-[#dbe5e1]">
            {([["Sexo", SEX[pet.sex]], ["Lugar de nacimiento", pet.birth_place], ["Color", pet.color], ["Microchip", pet.microchip], ["Dueño", pet.profiles?.full_name], ["Notas", pet.notes]] as [string, any][]).map(([k, val]) => (
              <div key={k}><dt className="text-ink/60">{k}</dt><dd>{val || "-"}</dd></div>
            ))}
          </dl>
          {isOwner && (
            <>
              {pet.owner_id === user.id && (
                <form action={uploadPhoto.bind(null, id)} className="flex flex-wrap items-center gap-3">
                  <input type="file" name="photo" accept="image/*" required className="text-sm" />
                  <button className="btn-ghost text-sm">Subir foto</button>
                </form>
              )}
              <details className="bg-white p-4 rounded-md border border-[#dbe5e1]">
                <summary className="font-semibold cursor-pointer">Editar datos</summary>
                <form action={updatePet.bind(null, id)} className="grid gap-3 sm:grid-cols-2 mt-3">
                  <Lbl t="Nombre"><input name="name" required defaultValue={pet.name} className="field" /></Lbl>
                  <Lbl t="Raza (texto)"><input name="breed_other" defaultValue={pet.breed_other ?? ""} className="field" /></Lbl>
                  <Lbl t="Sexo">
                    <select name="sex" defaultValue={pet.sex} className="field">
                      {Object.entries(SEX).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </Lbl>
                  <Lbl t="Nacimiento"><input type="date" name="birth_date" defaultValue={pet.birth_date ?? ""} className="field" /></Lbl>
                  <Lbl t="Lugar"><input name="birth_place" defaultValue={pet.birth_place ?? ""} className="field" /></Lbl>
                  <Lbl t="Color"><input name="color" defaultValue={pet.color ?? ""} className="field" /></Lbl>
                  <Lbl t="Microchip"><input name="microchip" defaultValue={pet.microchip ?? ""} className="field" /></Lbl>
                  <Lbl t="Notas"><input name="notes" defaultValue={pet.notes ?? ""} className="field" /></Lbl>
                  <button className="btn sm:col-span-2">Guardar cambios</button>
                </form>
              </details>
              <form action={archivePet.bind(null, id)}>
                <button className="text-sm underline text-alert">Archivar mascota</button>
              </form>
            </>
          )}
        </section>
      )}

      {tab === "vacunas" && (
        <section>
          <ul className="space-y-2">
            {[...h.vacc].reverse().map((x) => {
              const overdue = !x.applied_date && x.scheduled_date < today;
              return (
                <Item key={x.id} petId={id} table="vaccinations" id={x.id} canDelete={canHealth}>
                  <p className="font-semibold">{x.vaccine_types?.name}</p>
                  <p>Programada {x.scheduled_date}. {x.applied_date
                    ? `Aplicada el ${x.applied_date}${x.vet_name_text ? ` por ${x.vet_name_text}` : ""}${x.batch_number ? `, lote ${x.batch_number}` : ""}.`
                    : <span className={overdue ? "text-alert font-semibold" : ""}>{overdue ? "Vencida, sin aplicar." : "Pendiente."}</span>}</p>
                  {x.observations && <p className="text-ink/70">{x.observations}</p>}
                </Item>
              );
            })}
            {!h.vacc.length && <Empty>Sin vacunas registradas.</Empty>}
          </ul>
          {canHealth && <VaccForm petId={id} supabase={supabase} />}
        </section>
      )}

      {tab === "salud" && (
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-3">Consultas</h2>
            <ul className="space-y-2">
              {[...h.rec].reverse().map((x) => (
                <Item key={x.id} petId={id} table="medical_records" id={x.id} canDelete={canHealth}>
                  <p className="font-semibold">{x.visit_date}{x.clinic ? `, ${x.clinic}` : ""}</p>
                  <p>{[x.reason && `Motivo: ${x.reason}`, x.diagnosis && `Diagnóstico: ${x.diagnosis}`, x.treatment && `Tratamiento: ${x.treatment}`].filter(Boolean).join(". ")}</p>
                  {x.notes && <p className="text-ink/70">{x.notes}</p>}
                </Item>
              ))}
              {!h.rec.length && <Empty>Sin consultas registradas.</Empty>}
            </ul>
            {canHealth && (
              <RecordForm table="medical_records" petId={id} label="Guardar consulta">
                <Lbl t="Fecha"><input type="date" name="visit_date" required defaultValue={today} className="field" /></Lbl>
                <Lbl t="Clínica"><input name="clinic" className="field" /></Lbl>
                <input name="reason" placeholder="Motivo" className="field" />
                <input name="diagnosis" placeholder="Diagnóstico" className="field" />
                <input name="treatment" placeholder="Tratamiento" className="field" />
                <input name="notes" placeholder="Notas" className="field" />
              </RecordForm>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold mb-3">Medicamentos</h2>
            <ul className="space-y-2">
              {[...h.med].reverse().map((x) => (
                <Item key={x.id} petId={id} table="medications" id={x.id} canDelete={canHealth}>
                  <p className="font-semibold">{x.name}</p>
                  <p>{[x.dose, x.frequency, x.start_date && `desde ${x.start_date}`, x.end_date && `hasta ${x.end_date}`].filter(Boolean).join(", ")}</p>
                  {x.notes && <p className="text-ink/70">{x.notes}</p>}
                </Item>
              ))}
              {!h.med.length && <Empty>Sin medicamentos registrados.</Empty>}
            </ul>
            {canHealth && (
              <RecordForm table="medications" petId={id} label="Guardar medicamento">
                <input name="name" required placeholder="Medicamento" className="field" />
                <input name="dose" placeholder="Dosis" className="field" />
                <input name="frequency" placeholder="Frecuencia" className="field" />
                <input name="notes" placeholder="Notas" className="field" />
                <Lbl t="Inicio"><input type="date" name="start_date" className="field" /></Lbl>
                <Lbl t="Fin"><input type="date" name="end_date" className="field" /></Lbl>
              </RecordForm>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold mb-3">Alergias</h2>
            <ul className="space-y-2">
              {h.all.map((x) => (
                <Item key={x.id} petId={id} table="allergies" id={x.id} canDelete={canHealth}>
                  <p className="font-semibold">{x.allergen}</p>
                  <p>{[x.reaction, x.severity && `gravedad ${x.severity}`, x.detected_on && `detectada ${x.detected_on}`].filter(Boolean).join(", ")}</p>
                </Item>
              ))}
              {!h.all.length && <Empty>Sin alergias registradas.</Empty>}
            </ul>
            {canHealth && (
              <RecordForm table="allergies" petId={id} label="Guardar alergia">
                <input name="allergen" required placeholder="Alérgeno" className="field" />
                <input name="reaction" placeholder="Reacción" className="field" />
                <select name="severity" className="field" defaultValue="">
                  <option value="">Gravedad</option><option value="leve">Leve</option><option value="moderada">Moderada</option><option value="grave">Grave</option>
                </select>
                <input type="date" name="detected_on" className="field" aria-label="Fecha de detección" />
              </RecordForm>
            )}
          </div>
        </section>
      )}

      {tab === "alimentacion" && (
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-3">Planes por etapa</h2>
            <ul className="space-y-2">
              {[...h.plans].reverse().map((x) => (
                <Item key={x.id} petId={id} table="feeding_plans" id={x.id} canDelete={isOwner}>
                  <p className="font-semibold">{STAGE[x.stage]}{x.brand ? `, ${x.brand}` : ""}{x.food_type ? ` (${x.food_type})` : ""}</p>
                  <p>{[x.daily_grams && `${x.daily_grams} g al día`, x.meals_per_day && `${x.meals_per_day} comidas`, x.schedule, x.start_date && `desde ${x.start_date}`, x.end_date && `hasta ${x.end_date}`].filter(Boolean).join(", ")}</p>
                  {x.notes && <p className="text-ink/70">{x.notes}</p>}
                </Item>
              ))}
              {!h.plans.length && <Empty>Sin planes de alimentación.</Empty>}
            </ul>
            {isOwner && (
              <RecordForm table="feeding_plans" petId={id} label="Guardar plan">
                <select name="stage" required className="field" defaultValue="adult">
                  {Object.entries(STAGE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <input name="food_type" placeholder="Tipo (seco, húmedo, natural)" className="field" />
                <input name="brand" placeholder="Marca" className="field" />
                <input name="daily_grams" type="number" step="1" min="0" placeholder="Gramos al día" className="field" />
                <input name="meals_per_day" type="number" min="1" placeholder="Comidas al día" className="field" />
                <input name="schedule" placeholder="Horarios (8:00 y 18:00)" className="field" />
                <Lbl t="Inicio"><input type="date" name="start_date" className="field" /></Lbl>
                <Lbl t="Fin"><input type="date" name="end_date" className="field" /></Lbl>
                <input name="notes" placeholder="Notas" className="field sm:col-span-2" />
              </RecordForm>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold mb-3">Favoritas y restricciones</h2>
            <ul className="space-y-2">
              {h.prefs.map((x) => (
                <Item key={x.id} petId={id} table="food_preferences" id={x.id} canDelete={isOwner}>
                  <span className="font-semibold">{KIND[x.kind]}:</span> {x.description}
                </Item>
              ))}
              {!h.prefs.length && <Empty>Sin registros.</Empty>}
            </ul>
            {isOwner && (
              <RecordForm table="food_preferences" petId={id} label="Guardar">
                <select name="kind" className="field" defaultValue="favorite">
                  {Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <input name="description" required placeholder="Descripción (salmón, sin pollo)" className="field" />
              </RecordForm>
            )}
          </div>
        </section>
      )}

      {tab === "crecimiento" && (
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-3">Peso</h2>
            <WeightChart points={h.wt.map((w) => ({ d: w.measured_on, w: Number(w.weight_kg) }))} />
            <ul className="space-y-2 mt-3">
              {[...h.wt].reverse().map((x) => (
                <Item key={x.id} petId={id} table="weight_logs" id={x.id} canDelete={isOwner}>
                  <span className="font-semibold">{x.weight_kg} kg</span>, {x.measured_on}{x.notes ? `. ${x.notes}` : ""}
                </Item>
              ))}
            </ul>
            {isOwner && (
              <RecordForm table="weight_logs" petId={id} label="Guardar peso">
                <input type="date" name="measured_on" required defaultValue={today} className="field" aria-label="Fecha" />
                <input name="weight_kg" type="number" step="0.01" min="0.01" required placeholder="Peso en kg" className="field" />
                <input name="notes" placeholder="Notas" className="field sm:col-span-2" />
              </RecordForm>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold mb-3">Ejercicio</h2>
            <WeeklyExercise ex={h.ex} />
            <ul className="space-y-2 mt-3">
              {[...h.ex].reverse().slice(0, 30).map((x) => (
                <Item key={x.id} petId={id} table="exercise_logs" id={x.id} canDelete={isOwner}>
                  <span className="font-semibold">{x.exercise_type}</span>, {x.duration_min} min, intensidad {INTENSITY[x.intensity]?.toLowerCase()}, {x.performed_on}
                </Item>
              ))}
              {!h.ex.length && <Empty>Sin ejercicios registrados.</Empty>}
            </ul>
            {isOwner && (
              <RecordForm table="exercise_logs" petId={id} label="Guardar ejercicio">
                <input type="date" name="performed_on" required defaultValue={today} className="field" aria-label="Fecha" />
                <input name="exercise_type" required placeholder="Actividad (caminata, juego)" className="field" />
                <input name="duration_min" type="number" min="1" required placeholder="Minutos" className="field" />
                <select name="intensity" className="field" defaultValue="medium">
                  {Object.entries(INTENSITY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <input name="notes" placeholder="Notas" className="field sm:col-span-2" />
              </RecordForm>
            )}
          </div>
        </section>
      )}

      {tab === "historial" && <Timeline events={toEvents(h)} />}

      {tab === "veterinarios" && isOwner && <VetsTab petId={id} supabase={supabase} error={error} />}

      {tab === "exportar" && (
        <section className="space-y-4">
          <Note>Descarga el historial completo de {pet.name}, o solo un año.</Note>
          <form action={`/pets/${id}/export`} method="get" className="flex flex-wrap gap-3 items-end">
            <Lbl t="Formato">
              <select name="format" className="field"><option value="pdf">PDF</option><option value="xlsx">Excel</option></select>
            </Lbl>
            <Lbl t="Año (opcional)"><input name="year" type="number" min="1990" max="2100" placeholder="Todos" className="field" /></Lbl>
            <button className="btn">Descargar</button>
          </form>
        </section>
      )}
    </main>
  );
}

async function VaccForm({ petId, supabase }: { petId: string; supabase: any }) {
  const { data: types } = await supabase.from("vaccine_types").select("id,name").eq("active", true).order("name");
  return (
    <RecordForm table="vaccinations" petId={petId} label="Guardar vacuna">
      <select name="vaccine_type_id" required className="field sm:col-span-2" defaultValue="">
        <option value="">Tipo de vacuna</option>
        {types?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <Lbl t="Fecha programada"><input name="scheduled_date" type="date" required className="field" /></Lbl>
      <Lbl t="Fecha aplicada"><input name="applied_date" type="date" className="field" /></Lbl>
      <input name="vet_name_text" placeholder="Veterinario" className="field" />
      <input name="batch_number" placeholder="Lote" className="field" />
      <input name="observations" placeholder="Observaciones" className="field sm:col-span-2" />
    </RecordForm>
  );
}

function WeeklyExercise({ ex }: { ex: any[] }) {
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const week = ex.filter((x) => x.performed_on >= since);
  const mins = week.reduce((s, x) => s + (x.duration_min ?? 0), 0);
  return <Note>Últimos 7 días: {week.length} sesiones, {mins} minutos en total.</Note>;
}

function Timeline({ events }: { events: { date: string; kind: string; text: string }[] }) {
  if (!events.length) return <p className="text-ink/70">Aún no hay eventos. Cuando registres vacunas, consultas o pesos, aparecerán aquí por año.</p>;
  const byYear = new Map<string, typeof events>();
  events.forEach((e) => { const y = e.date.slice(0, 4); byYear.set(y, [...(byYear.get(y) ?? []), e]); });
  return (
    <section className="space-y-6">
      {[...byYear].map(([year, list]) => (
        <div key={year}>
          <h2 className="text-2xl font-extrabold text-pine">{year}</h2>
          <ul className="border-l-2 border-amber pl-4 mt-2 space-y-2 text-sm">
            {list.map((e, i) => (
              <li key={i}><span className="text-ink/60">{e.date}</span> <span className="font-semibold">{e.kind}</span>: {e.text}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

async function VetsTab({ petId, supabase, error }: { petId: string; supabase: any; error?: string }) {
  const { data: vets } = await supabase.rpc("list_pet_vets", { p_pet: petId });
  return (
    <section className="space-y-4">
      <Note>Los veterinarios con acceso pueden ver la ficha y registrar vacunas, consultas, medicamentos y alergias. Debe ser un veterinario ya registrado en ConsultaPet.</Note>
      <ul className="space-y-2">
        {(vets ?? []).map((x: any) => (
          <li key={x.vet_id} className="bg-white rounded-md p-3 border border-[#dbe5e1] text-sm flex justify-between">
            <span><span className="font-semibold">{x.full_name}</span>, {x.email}</span>
            <form action={revokeVet.bind(null, petId, x.vet_id)}><button className="text-xs underline text-alert">Quitar acceso</button></form>
          </li>
        ))}
        {!vets?.length && <Empty>Ningún veterinario tiene acceso todavía.</Empty>}
      </ul>
      <form action={grantVet.bind(null, petId)} className="flex flex-wrap gap-3">
        <input name="email" type="email" required placeholder="Correo del veterinario" className="field max-w-xs" />
        <button className="btn">Dar acceso</button>
      </form>
      {error && <p role="alert" className="text-sm text-alert">{error}</p>}
    </section>
  );
}
