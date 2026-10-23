'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function setRole(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const id = String(formData.get('id'))
  const role = String(formData.get('role'))
  if (!user || id === user.id || !['owner', 'admin'].includes(role)) redirect('/admin')
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message))
  revalidatePath('/admin')
  redirect('/admin')
}

export async function addVaccineType(formData: FormData) {
  const supabase = await createClient()
  const name = String(formData.get('name') || '').trim()
  const days = String(formData.get('interval_days') || '').trim()
  if (!name) redirect('/admin?error=' + encodeURIComponent('Escribe el nombre de la vacuna.'))
  const { error } = await supabase.from('vaccine_types').insert({ name, interval_days: days ? Number(days) : null })
  if (error) redirect('/admin?error=' + encodeURIComponent(error.message))
  revalidatePath('/admin')
  redirect('/admin')
}
