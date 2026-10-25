export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
export const fmtDate = (v?: string | null) =>
  v ? new Date(v + (v.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function ageText(birth?: string | null) {
  if (!birth) return 'Edad desconocida';
  const b = new Date(birth + 'T00:00:00'), n = new Date();
  let m = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth();
  if (n.getDate() < b.getDate()) m--;
  if (m < 1) return 'Recién nacido';
  const y = Math.floor(m / 12), r = m % 12;
  return [y ? `${y} ${y === 1 ? 'año' : 'años'}` : '', r ? `${r} ${r === 1 ? 'mes' : 'meses'}` : ''].filter(Boolean).join(' ');
}

export const SPECIES: Record<string, string> = { dog: 'Perro', cat: 'Gato', other: 'Otro' };
export const SEX: Record<string, string> = { male: 'Macho', female: 'Hembra', unknown: 'Sin definir' };
