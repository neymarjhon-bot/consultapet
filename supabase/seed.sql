-- Datos de prueba: 1 dueño + 2 perros con historial, atendidos por un administrador veterinario.
-- Requisito: las dos cuentas ya existen (regístralas desde /login). Cambia los correos si usas otros.
do $$
declare
  v_owner uuid := (select id from public.profiles where email = 'farfo_555@hotmail.com');
  v_vet   uuid := (select id from public.profiles where email = 'neymar.jhon@gmail.com');
  v_luna  uuid; v_rocky uuid;
begin
  if v_owner is null or v_vet is null then raise exception 'Faltan las cuentas de dueño o veterinario'; end if;

  insert into public.pets (owner_id,name,species,sex,birth_date,birth_place,color,origin_type,notes,breed_id)
  values (v_owner,'Luna','dog','female','2023-03-14','Concepción','Dorado','Criadero Los Aromos','Madre: Canela (labrador). Padre: Thor (labrador).',
          (select id from public.breeds where name ilike '%labrador%' limit 1))
  returning id into v_luna;

  insert into public.pets (owner_id,name,species,sex,birth_date,birth_place,color,origin_type,notes,breed_other)
  values (v_owner,'Rocky','dog','male','2021-08-02','Coronel','Negro con blanco','Adopción','Rescatado a los 2 meses.','Mestizo')
  returning id into v_rocky;

  insert into public.vaccinations (pet_id,vaccine_type_id,scheduled_date,applied_date,vet_id,vet_name_text,batch_number,observations)
  select v_luna, id, date '2023-05-10', date '2023-05-10', v_vet, 'Clínica Veterinaria Central', 'L-2305', 'Sin reacciones' from public.vaccine_types order by id limit 1;
  insert into public.vaccinations (pet_id,vaccine_type_id,scheduled_date)
  select v_luna, id, current_date + 12 from public.vaccine_types order by id offset 1 limit 1;
  insert into public.vaccinations (pet_id,vaccine_type_id,scheduled_date)
  select v_rocky, id, current_date - 20 from public.vaccine_types order by id limit 1;

  insert into public.medical_records (pet_id,visit_date,vet_id,clinic,reason,diagnosis,treatment)
  values (v_luna, date '2024-02-20', v_vet, 'Clínica Veterinaria Central', 'Picazón persistente', 'Dermatitis alérgica leve', 'Baños medicados 2 semanas');
  insert into public.medications (pet_id,name,dose,frequency,start_date,end_date)
  values (v_luna,'Antihistamínico','5 mg','1 vez al día', date '2024-02-20', date '2024-03-05');
  insert into public.allergies (pet_id,allergen,reaction,severity,detected_on)
  values (v_luna,'Pollo','Picazón y enrojecimiento','moderada', date '2024-02-20');

  insert into public.feeding_plans (pet_id,stage,food_type,brand,daily_grams,meals_per_day,schedule,start_date)
  values (v_luna,'adult','Croqueta sin pollo','Marca de ejemplo',320,2,'08:00 y 19:00', date '2024-03-01'),
         (v_rocky,'adult','Croqueta adulto','Marca de ejemplo',280,2,'09:00 y 20:00', date '2022-01-01');
  insert into public.food_preferences (pet_id,kind,description)
  values (v_luna,'favorite','Zanahoria'),(v_luna,'restriction','Evitar pollo'),(v_rocky,'favorite','Galletas de avena');

  insert into public.weight_logs (pet_id,measured_on,weight_kg)
  values (v_luna,'2023-05-14',8.4),(v_luna,'2023-09-14',19.8),(v_luna,'2024-03-14',27.5),(v_luna,'2025-03-14',29.1),
         (v_rocky,'2022-01-10',14.2),(v_rocky,'2024-01-10',18.9),(v_rocky,'2025-01-10',19.4);

  insert into public.exercise_logs (pet_id,performed_on,exercise_type,duration_min,intensity)
  values (v_luna,current_date-1,'Caminata',45,'medium'),(v_luna,current_date-3,'Juego con pelota',30,'high'),
         (v_luna,current_date-9,'Natación',40,'high'),(v_rocky,current_date-2,'Trote',25,'medium');
end $$;
