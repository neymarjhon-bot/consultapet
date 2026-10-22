# ConsultaPet

Portal de gestión de mascotas. Next.js 15 + Supabase + Vercel.

## Perfiles
- **Dueño**: registra sus mascotas; gestiona vacunas, alergias, alimentación, peso y ejercicio. Ve (solo lectura) consultas y medicamentos.
- **Administrador veterinario**: ve y gestiona todas las mascotas, registra consultas y medicamentos, cambia perfiles de usuarios, administra el catálogo de vacunas y consulta la auditoría.

## Desarrollo
```
cp .env.example .env.local
npm install
npm run dev
```
Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Primer administrador
En el SQL Editor de Supabase: `update profiles set role = 'admin' where email = 'tu@correo.com';`
