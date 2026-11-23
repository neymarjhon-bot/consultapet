export default function WeeklyBars({ rows }: { rows: { performed_on: string; duration_min: number }[] }) {
  const weekStart = (d: string) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
  const map = new Map<string, number>();
  rows.forEach((r) => map.set(weekStart(r.performed_on), (map.get(weekStart(r.performed_on)) ?? 0) + r.duration_min));
  const weeks = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8).reverse();
  if (!weeks.length) return null;
  const max = Math.max(...weeks.map((w) => w[1]));
  return (
    <section className="card"><h2>Minutos por semana</h2>
      <div className="bars" style={{ marginTop: '.6rem' }}>
        {weeks.map(([w, m]) => (<div className="bar" key={w}><span>Sem. {w.slice(5)}</span><i style={{ width: `${(m / max) * 100}%` }} /><b>{m} min</b></div>))}
      </div>
    </section>
  );
}
