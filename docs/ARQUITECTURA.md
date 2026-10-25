# ConsultaPet — Arquitectura y diseño

## 1. Arquitectura
| Capa | Tecnología | Rol |
|---|---|---|
| Frontend + BFF | Next.js 15 (App Router, React 19, Server Actions) en Vercel | UI responsive, formularios vía Server Actions, exportación |
| Autenticación | Supabase Auth (email/contraseña, hash bcrypt) + `@supabase/ssr` | Sesión por cookies, `middleware.ts` protege rutas |
| Datos y seguridad | Supabase Postgres 17 + Row Level Security | El control de acceso real vive en la base, no en la UI |
| Código | GitHub `consultapet` → Vercel (deploy automático en cada push a `main`) | CI/CD |

Flujo: navegador → Next.js (Server Components consultan con la sesión del usuario) → Supabase (RLS filtra por `auth.uid()`).
No se usa `service_role` en la app: un fallo del frontend nunca puede saltarse la seguridad.

## 2. Modelo de datos (schema `public`)
- `profiles` (1–1 con `auth.users`): rol `owner | admin`, datos de contacto y dirección.
- `pets`: `owner_id → profiles`, `breed_id → breeds`, especie, sexo, nacimiento, lugar, microchip, procedencia/padres (`origin_type`, `notes`), borrado lógico (`deleted_at`).
- `breeds`, `vaccine_types`: catálogos gestionados por el administrador.
- `vaccinations`: mascota, tipo, fecha programada/aplicada, veterinario, lote, observaciones.
- `medical_records` → `medications`; `allergies`.
- `feeding_plans` (etapa cachorro/adulto/senior), `food_preferences` (favorita/restricción).
- `weight_logs`, `exercise_logs`.
- `pet_vets`: acceso por mascota para veterinarios externos (preparado para fase 2).
- `audit_log`: historial de cambios críticos (tabla, acción, datos antes/después, autor).

Relaciones: `profiles 1—N pets`, `pets 1—N` (vacunas, consultas, medicamentos, alergias, planes, preferencias, pesos, ejercicios).

## 3. Roles (dos perfiles)
| Acción | Dueño | Administrador veterinario |
|---|---|---|
| Registrar/editar sus mascotas | ✔ (solo las suyas) | ✔ (de cualquier dueño) |
| Vacunas, alergias, alimentación, peso, ejercicio | ✔ propias | ✔ todas |
| Consultas y medicamentos | solo lectura | ✔ |
| Usuarios, roles, catálogos, auditoría | ✘ | ✔ |

## 4. Pantallas y navegación
`/login` (ingreso/registro) → `/` (mis mascotas + alertas de vacunas; admin: todas con buscador)
→ `/pets/new` · `/pets/[id]` con pestañas Resumen · Vacunas · Salud · Alimentación · Peso (gráfica) · Ejercicio
→ `/pets/[id]/print` (historial completo, imprimir/PDF) · `/pets/[id]/export` (Excel/CSV)
→ `/profile` · `/admin` (Usuarios · Catálogos · Auditoría).

## 5. Endpoints / operaciones (CRUD)
Se usan Server Actions (`app/actions.ts`) sobre la API REST de Supabase (PostgREST), protegidas por RLS:
| Recurso | Create | Read | Update | Delete |
|---|---|---|---|---|
| pets | `createPet` | `/`, `/pets/[id]` | `archivePet` (borrado lógico) | — |
| registros por sección | `addRow(section)` | pestañas | `markApplied` (vacunas) | `deleteRow` |
| perfil | auto (trigger `handle_new_user`) | `/profile` | `updateProfile` | — |
| roles / catálogos | `addBreed`, `addVaccineType` | `/admin` | `setRole`, `toggleCatalog` | desactivar |
| exportación | — | `GET /pets/[id]/export` (CSV) | — | — |

## 6. MVP y roadmap
**MVP (esta versión):** autenticación, perfiles, mascotas múltiples, vacunas con alertas, historial médico, alimentación, peso con gráfica, ejercicio con resumen semanal, panel admin (roles, catálogos, auditoría), exportación CSV e impresión PDF, responsive.
**Fase 2:** fotos de mascotas (Supabase Storage), PDF/Excel nativos, metas semanales/mensuales, recordatorios por correo/WhatsApp (Edge Function + cron), edición de registros, documentos del dueño.
**Fase 3:** rol veterinario externo con acceso por mascota (`pet_vets`), certificados de vacunación con QR, carnet digital compartible, app móvil (PWA), copias de seguridad programadas.

## 7. Datos de prueba
`supabase/seed.sql`: dueño + 2 perros (Luna y Rocky) con vacunas (aplicada, próxima y vencida), consulta, medicamento, alergia, alimentación, pesos y ejercicio, atendidos por el administrador veterinario.
