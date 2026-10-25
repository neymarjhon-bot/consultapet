# ConsultaPet

Portal de gestión de mascotas: historial de salud, alimentación y crecimiento. Next.js 15 + Supabase + Vercel.

## Variables de entorno (Vercel → Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
## Desarrollo local
```
cp .env.example .env.local   # completa la clave publicable
npm install && npm run dev
```
## Roles
`owner` (dueño) y `admin` (administrador veterinario). Para ascender a alguien: Administración → Usuarios.
Documentación completa en `docs/ARQUITECTURA.md`.
