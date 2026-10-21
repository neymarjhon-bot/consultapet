'use client';
import Shell from '@/components/Shell';
import PetForm from '@/components/PetForm';

export default function Page() {
  return (
    <Shell roles={['owner', 'admin']}>
      <h1 className="mb-4 text-xl font-bold">Nueva mascota</h1>
      <PetForm />
    </Shell>
  );
}
