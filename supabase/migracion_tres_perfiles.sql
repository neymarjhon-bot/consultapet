-- ============================================================================
-- ConsultaPet 360 - Migración: tres perfiles (dueño, veterinario, administrador)
-- Aplica sobre la base existente sin borrar datos.
--   * Dueño:          registra sus mascotas y consulta su historial (solo lectura clínica).
--   * Veterinario:    ve y registra información clínica solo de sus pacientes asignados.
--   * Administrador:  todo lo del veterinario para cualquier mascota, más usuarios,
--                     asignaciones, catálogos y auditoría.
-- ============================================================================
begin;

-- 1) Habilitar el rol veterinario (el tipo user_role ya incluye 'vet')
alter table public.profiles drop constraint if exists profiles_two_roles_only;

-- 2) Funciones de rol
create or replace function public.is_vet() returns boolean
  language sql stable security definer set search_path to 'public'
as $$ select coalesce(current_role_name() = 'vet', false) $$;

create or replace function public.is_staff() returns boolean
  language sql stable security definer set search_path to 'public'
as $$ select coalesce(current_role_name() in ('vet', 'admin'), false) $$;

-- Puede escribir información clínica: el administrador o el veterinario asignado a la mascota
create or replace function public.can_vet_write_pet(p uuid) returns boolean
  language sql stable security definer set search_path to 'public'
as $$ select is_admin() or (is_vet() and is_pet_vet(p)) $$;

-- 3) Escritura clínica: solo veterinario asignado o administrador (el dueño queda en solo lectura)
do $$
declare t text;
begin
  foreach t in array array['vaccinations', 'medical_records', 'medications', 'allergies',
                           'feeding_plans', 'food_preferences', 'weight_logs', 'exercise_logs'] loop
    execute format('drop policy if exists %I on public.%I', t || '_write', t);
    execute format('create policy %I on public.%I for all using (can_vet_write_pet(pet_id)) with check (can_vet_write_pet(pet_id))',
                   t || '_write', t);
  end loop;
end $$;

-- 4) Asignación de veterinarios a mascotas: la gestiona solo el administrador
drop policy if exists pet_vets_owner on public.pet_vets;
drop policy if exists pet_vets_admin on public.pet_vets;
drop policy if exists pet_vets_owner_read on public.pet_vets;
create policy pet_vets_admin on public.pet_vets for all using (is_admin()) with check (is_admin());
create policy pet_vets_owner_read on public.pet_vets for select using (is_pet_owner(pet_id));
-- (se mantiene pet_vets_self_read: cada veterinario ve sus propias asignaciones)

create or replace function public.check_pet_vet_role() returns trigger
  language plpgsql security definer set search_path to 'public'
as $$
begin
  if not exists (select 1 from profiles where id = new.vet_id and role = 'vet') then
    raise exception 'Solo se pueden asignar usuarios con rol veterinario';
  end if;
  return new;
end $$;
drop trigger if exists trg_pet_vets_role on public.pet_vets;
create trigger trg_pet_vets_role before insert or update on public.pet_vets
  for each row execute function check_pet_vet_role();
drop trigger if exists trg_pet_vets_audit on public.pet_vets;
create trigger trg_pet_vets_audit after insert or update or delete on public.pet_vets
  for each row execute function audit_row();

create or replace function public.grant_vet_access(p_pet uuid, p_email text) returns void
  language plpgsql security definer set search_path to 'public'
as $$
declare v uuid;
begin
  if not is_admin() then raise exception 'Solo el administrador puede asignar veterinarios'; end if;
  select id into v from profiles where lower(email) = lower(trim(p_email)) and role = 'vet';
  if v is null then raise exception 'No existe un veterinario registrado con ese correo'; end if;
  insert into pet_vets(pet_id, vet_id) values (p_pet, v) on conflict do nothing;
end $$;

create or replace function public.list_pet_vets(p_pet uuid)
  returns table(vet_id uuid, full_name text, email text)
  language sql stable security definer set search_path to 'public'
as $$
  select p.id, p.full_name, p.email
  from pet_vets pv join profiles p on p.id = pv.vet_id
  where pv.pet_id = p_pet and (is_pet_owner(p_pet) or is_admin() or is_pet_vet(p_pet))
$$;

-- 5) El nombre del personal (veterinarios y administradores) es visible para usuarios con sesión,
--    para mostrar quién registró cada atención
drop policy if exists profiles_staff_read on public.profiles;
create policy profiles_staff_read on public.profiles for select to authenticated using (role in ('vet', 'admin'));

-- 6) Programación automática de la próxima dosis al aplicar una vacuna
create or replace function public.programar_proxima_dosis() returns trigger
  language plpgsql set search_path to 'public'
as $$
declare dias int;
begin
  if new.applied_date is null or (tg_op = 'UPDATE' and old.applied_date is not null) then
    return new;
  end if;
  select interval_days into dias from vaccine_types where id = new.vaccine_type_id;
  if dias is null or dias <= 0 then
    return new;
  end if;
  if exists (select 1 from vaccinations
             where pet_id = new.pet_id and vaccine_type_id = new.vaccine_type_id
               and applied_date is null and id <> new.id) then
    return new;
  end if;
  insert into vaccinations (pet_id, vaccine_type_id, scheduled_date, observations)
  values (new.pet_id, new.vaccine_type_id, new.applied_date + dias, 'Refuerzo programado automáticamente');
  return new;
end $$;
drop trigger if exists trg_programar_proxima_dosis on public.vaccinations;
create trigger trg_programar_proxima_dosis after insert or update of applied_date on public.vaccinations
  for each row execute function programar_proxima_dosis();

-- 7) Microchip: exactamente 15 dígitos (norma ISO 11784/11785)
--    Se archiva la mascota creada en la prueba PP-03, que tenía un microchip de 14 dígitos.
update public.pets set microchip = null, deleted_at = coalesce(deleted_at, now())
 where name = 'Chip corto (prueba)' and microchip = '94100002468135';
alter table public.pets drop constraint if exists pets_microchip_format;
alter table public.pets add constraint pets_microchip_format check (microchip is null or microchip ~ '^[0-9]{15}$');

-- 8) Ajustes al modelo solicitados en la revisión de la Evaluación 2
--    El sistema opera solo en Chile: el país no aporta información y se elimina.
alter table public.profiles drop column if exists country;
--    Observaciones adicionales en las alergias (indicaciones, contexto de la reacción).
alter table public.allergies add column if not exists notes text;
--    Campos del diseño de la Unidad II que aún no estaban en la base.
alter table public.medical_records add column if not exists next_control_date date;
alter table public.weight_logs add column if not exists medical_record_id uuid
  references public.medical_records(id) on delete set null;

-- 9) Avisos por correo al dueño
--    Preferencias y consentimiento de cada dueño (Ley 19.628).
create table if not exists public.notification_preferences (
  owner_id      uuid primary key references public.profiles(id) on delete cascade,
  email_enabled boolean not null default true,
  remind_7d     boolean not null default true,
  remind_1d     boolean not null default true,
  consent_at    timestamptz,
  updated_at    timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
drop policy if exists np_select on public.notification_preferences;
drop policy if exists np_insert on public.notification_preferences;
drop policy if exists np_update on public.notification_preferences;
create policy np_select on public.notification_preferences for select using (owner_id = auth.uid() or is_staff());
create policy np_insert on public.notification_preferences for insert with check (owner_id = auth.uid());
create policy np_update on public.notification_preferences for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

--    Cola e historial de correos: agendamiento, próxima dosis y recordatorios 7 y 1 día antes.
create table if not exists public.notifications (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles(id) on delete cascade,
  vaccination_id    uuid references public.vaccinations(id) on delete cascade,
  medical_record_id uuid references public.medical_records(id) on delete cascade,
  kind              varchar(20) not null check (kind in ('vaccine_scheduled', 'next_dose', 'vaccine_7d', 'vaccine_1d', 'vaccine_overdue', 'visit_summary')),
  to_email          varchar(255) not null,
  status            varchar(10) not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts          smallint not null default 0 check (attempts between 0 and 3),
  last_error        varchar(255),
  scheduled_for     timestamptz not null default now(),
  sent_at           timestamptz,
  created_at        timestamptz not null default now()
);
create unique index if not exists notifications_vacc_kind_uk on public.notifications (vaccination_id, kind) where vaccination_id is not null;
create index if not exists notifications_status_idx on public.notifications (status, scheduled_for);
alter table public.notifications enable row level security;
drop policy if exists notifications_read on public.notifications;
drop policy if exists notifications_insert on public.notifications;
create policy notifications_read on public.notifications for select using (is_admin() or owner_id = auth.uid());
create policy notifications_insert on public.notifications for insert with check (is_staff());

commit;
