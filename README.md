# ConsultaPet

Next.js 15 + Supabase (proyecto `petmanager`) + Vercel.

## Roles
- **Dueño**: mascotas, vacunas, salud, alimentación, crecimiento, historial por año, exportación, acceso para veterinarios.
- **Veterinario**: ve a sus pacientes y registra vacunas, consultas, medicamentos y alergias.
- **Administrador**: usuarios y roles, catálogos de vacunas y razas, todas las mascotas.

## Desarrollo
```bash
cp .env.example .env.local
npm install
npm run dev
```
Variables en Vercel: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
