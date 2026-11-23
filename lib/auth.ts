import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Role = 'owner' | 'vet' | 'admin';
export const ROLE_LABEL: Record<Role, string> = { owner: 'Dueño', vet: 'Veterinario', admin: 'Administrador' };

export async function requireProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');
  const role = profile.role as Role;
  const isAdmin = role === 'admin';
  const isVet = role === 'vet';
  return {
    supabase, user, profile, role,
    isAdmin, isVet,
    isOwner: role === 'owner',
    // personal de la clínica: registra información clínica (el veterinario, solo en sus pacientes asignados)
    isStaff: isAdmin || isVet,
    // puede registrar y editar los datos básicos de mascotas
    canManagePets: isAdmin || role === 'owner',
  };
}

export async function requireAdmin() {
  const ctx = await requireProfile();
  if (!ctx.isAdmin) redirect('/');
  return ctx;
}

export async function requireStaff() {
  const ctx = await requireProfile();
  if (!ctx.isStaff) redirect('/?error=' + encodeURIComponent('Solo el personal veterinario puede registrar información clínica'));
  return ctx;
}
