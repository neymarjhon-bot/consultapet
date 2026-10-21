'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { fmtDate } from '@/lib/utils';

export default function WeightChart({ petId, reloadKey }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    supabase.from('weight_logs').select('measured_on,weight_kg').eq('pet_id', petId).order('measured_on')
      .then(({ data }) => setData((data || []).map((d) => ({ fecha: fmtDate(d.measured_on), kg: Number(d.weight_kg) }))));
  }, [petId, reloadKey]);
  if (data.length < 2) return <div className="card text-sm text-stone-500">Registra al menos 2 pesos para ver la gráfica de crecimiento.</div>;
  return (
    <div className="card">
      <h3 className="mb-2 font-semibold">Evolución del peso (kg)</h3>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="kg" stroke="#16824a" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
