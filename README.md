# ConsultaPet 🐾
Next.js 14 + Supabase (proyecto `petmanager`) + Vercel.

Roles (solo dos): **owner** (Dueño: registra sus mascotas y su cuidado) y **admin** (Administrador veterinario: gestiona todo, consultas, usuarios y auditoría).

## Local
cp .env.example .env.local && npm install && npm run dev

## Vercel
Variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.example).
Supabase > Authentication > URL Configuration: agrega la URL de Vercel como Site URL.

## Crear admin / veterinario
Regístrate normalmente y luego en Supabase SQL Editor:
update public.profiles set role='admin' where email='tu@correo.com';
(luego el admin cambia roles desde /admin)
