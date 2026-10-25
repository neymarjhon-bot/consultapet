'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOut() {
  const router = useRouter();
  return (
    <button onClick={async () => { await createClient().auth.signOut(); router.replace('/login'); router.refresh(); }}>
      Cerrar sesión
    </button>
  );
}
