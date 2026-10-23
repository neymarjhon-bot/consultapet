'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

export default function WeightChart({ data }: { data: { date: string; kg: number }[] }) {
  if (data.length < 2) return <p className="text-sm text-pine-700">Registra al menos dos pesos para ver la gráfica.</p>
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#D6E7E2" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit=" kg" domain={['auto', 'auto']} />
          <Tooltip formatter={(v) => [`${v} kg`, 'Peso']} />
          <Line type="monotone" dataKey="kg" stroke="#1F4D45" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
