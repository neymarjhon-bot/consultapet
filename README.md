# ConsultaPet

Next.js 15 + Supabase (proyecto `petmanager`) + Vercel.

## Desarrollo
```bash
cp .env.example .env.local
npm install
npm run dev
```
Variables en Vercel: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ya cargadas).
En Supabase > Authentication > URL Configuration agrega la URL de Vercel como Site URL.
