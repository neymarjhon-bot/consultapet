export const today = () => new Date().toISOString().slice(0, 10);

export function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = String(d).slice(0, 10).split('-');
  return `${day}-${m}-${y}`;
}

export function age(birth) {
  if (!birth) return '—';
  const b = new Date(birth);
  const n = new Date();
  let months = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  if (n.getDate() < b.getDate()) months -= 1;
  if (months < 0) return '—';
  const y = Math.floor(months / 12), m = months % 12;
  return [y ? `${y} ${y === 1 ? 'año' : 'años'}` : '', m ? `${m} ${m === 1 ? 'mes' : 'meses'}` : ''].filter(Boolean).join(' ') || 'Recién nacido';
}

export const STATUS = {
  applied: { label: 'Aplicada', cls: 'bg-green-100 text-green-800' },
  scheduled: { label: 'Programada', cls: 'bg-stone-100 text-stone-700' },
  due_soon: { label: 'Próxima', cls: 'bg-amber-100 text-amber-800' },
  overdue: { label: 'Vencida', cls: 'bg-red-100 text-red-800' }
};

export const ROLE_LABEL = { owner: 'Dueño', vet: 'Veterinario', admin: 'Administrador' };
