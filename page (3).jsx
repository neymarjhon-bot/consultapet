'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/Shell';
import PetAvatar from '@/components/PetAvatar';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { age, fmtDate, STATUS } from '@/lib/utils';

function Dashboard() {
  const { profile } = useAuth();
  const [pets, setPets] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('pets').select('*, breeds(name)').is('deleted_at', null).order('name');
      setPets(data || []);
      const ids = (data || []).map((p) => p.id);
      if (ids.length) {
        const { data: v } = await supabase.from('vaccination_status').select('*')
          .in('pet_id', ids).in('status', ['overdue', 'due_soon']).order('scheduled_date');
        setAlerts(v || []);
      }
    })();
  }, []);

  const title = profile.role === 'vet' ? 'Mis pacientes' : profile.role === 'admin' ? 'Todas las mascotas' : 'Mis mascotas';
  const petName = (id) => pets?.find((p) => p.id === id)?.name;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        {profile.role !== 'vet' && <Link href="/pets/new" className="btn">+ Nueva mascota</Link>}
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-amber-900">🔔 Alertas de vacunas</h2>
          <ul className="space-y-1 text-sm">
            {alerts.map((a) => (
              <li key={a.id}>
                <Link href={`/pets/${a.pet_id}`} className="hover:underline">
                  <span className={`badge mr-2 ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span>
                  <strong>{petName(a.pet_id)}</strong> – {a.vaccine_name} ({fmtDate(a.scheduled_date)})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pets === null ? <p className="text-stone-500">Cargando…</p> : pets.length === 0 ? (
        <div className="card text-center text-stone-600">
          <div className="text-4xl">🐕 🐈</div>
          <p className="mt-2">{profile.role === 'vet' ? 'Aún no tienes pacientes. Un dueño debe compartir su mascota contigo usando tu correo.' : 'Aún no tienes mascotas registradas.'}</p>
          {profile.role !== 'vet' && <Link href="/pets/new" className="btn mt-4">Registrar mi primera mascota</Link>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((p) => (
            <Link key={p.id} href={`/pets/${p.id}`} className="card flex items-center gap-4 transition hover:shadow-md">
              <PetAvatar path={p.photo_path} size={64} species={p.species} />
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-stone-500">{p.breeds?.name || p.breed_other || 'Sin raza'}</div>
                <div className="text-xs text-stone-500">{age(p.birth_date)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function Page() { return <Shell><Dashboard /></Shell>; }
