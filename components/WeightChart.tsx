export default function WeightChart({ points }: { points: { d: string; w: number }[] }) {
  if (points.length < 2) return <p className="text-sm text-ink/70">Registra al menos dos pesos para ver la gráfica.</p>;
  const W = 480, H = 170, P = 26;
  const ws = points.map((p) => p.w);
  const min = Math.min(...ws), max = Math.max(...ws), span = max - min || 1;
  const xy = points.map((p, i) => [P + (i * (W - 2 * P)) / (points.length - 1), H - P - ((p.w - min) / span) * (H - 2 * P)]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evolución del peso" className="w-full bg-white rounded-md border border-[#dbe5e1]">
      <polyline fill="none" stroke="#1f3d36" strokeWidth="2.5" points={xy.map((p) => p.join(",")).join(" ")} />
      {xy.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#e8a33d" />
          <text x={x} y={y - 9} fontSize="11" textAnchor="middle">{points[i].w} kg</text>
          <text x={x} y={H - 6} fontSize="9" textAnchor="middle" fill="#555">{points[i].d.slice(0, 7)}</text>
        </g>
      ))}
    </svg>
  );
}
