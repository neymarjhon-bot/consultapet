export default function WeightChart({ data }: { data: { measured_on: string; weight_kg: number }[] }) {
  if (data.length < 2) return <p className="sub">Con dos o más pesajes verás aquí la curva de crecimiento.</p>;
  const W = 640, H = 220, P = 36;
  const pts = [...data].sort((a, b) => a.measured_on.localeCompare(b.measured_on)).map((d) => ({ t: new Date(d.measured_on).getTime(), w: Number(d.weight_kg), d: d.measured_on }));
  const minT = pts[0].t, maxT = pts[pts.length - 1].t || 1;
  const ws = pts.map((p) => p.w), minW = Math.min(...ws) * 0.9, maxW = Math.max(...ws) * 1.05;
  const x = (t: number) => P + ((t - minT) / (maxT - minT || 1)) * (W - P * 2);
  const y = (w: number) => H - P - ((w - minW) / (maxW - minW || 1)) * (H - P * 2);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.w).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evolución del peso en kilos" style={{ width: '100%', height: 'auto' }}>
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#D3DCD7" /><line x1={P} y1={P / 2} x2={P} y2={H - P} stroke="#D3DCD7" />
      <text x={4} y={y(maxW) + 4} fontSize="11" fill="#5A6A62">{maxW.toFixed(1)} kg</text>
      <text x={4} y={y(minW)} fontSize="11" fill="#5A6A62">{minW.toFixed(1)} kg</text>
      <path d={path} fill="none" stroke="#0F5C4D" strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p, i) => (<g key={i}><circle cx={x(p.t)} cy={y(p.w)} r="4" fill="#0F5C4D" /><title>{p.d}: {p.w} kg</title></g>))}
      <text x={P} y={H - 10} fontSize="11" fill="#5A6A62">{pts[0].d}</text>
      <text x={W - P} y={H - 10} fontSize="11" fill="#5A6A62" textAnchor="end">{pts[pts.length - 1].d}</text>
    </svg>
  );
}
