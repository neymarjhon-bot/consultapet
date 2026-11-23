// Todas las fechas se calculan en la hora de Chile continental, no en UTC
export const TZ = 'America/Santiago';

const ymd = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

export const today = () => ymd(new Date());

export const addDays = (days: number, from?: string) => {
  const base = new Date((from ?? today()) + 'T12:00:00Z');
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
};

export const fmtDate = (v?: string | null) =>
  v ? new Date(v + (v.length === 10 ? 'T12:00:00Z' : '')).toLocaleDateString('es-CL', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('es-CL', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export function ageText(birth?: string | null) {
  if (!birth) return 'Edad desconocida';
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ny, nm, nd] = today().split('-').map(Number);
  let m = (ny - by) * 12 + nm - bm;
  if (nd < bd) m--;
  if (m < 1) return 'Recién nacido';
  const y = Math.floor(m / 12), r = m % 12;
  return [y ? `${y} ${y === 1 ? 'año' : 'años'}` : '', r ? `${r} ${r === 1 ? 'mes' : 'meses'}` : ''].filter(Boolean).join(' ');
}

export const SPECIES: Record<string, string> = { dog: 'Perro', cat: 'Gato', other: 'Otro' };
export const SEX: Record<string, string> = { male: 'Macho', female: 'Hembra', unknown: 'Sin definir' };
