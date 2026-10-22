import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getSessionProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'vet'
  return { supabase, user, profile: profile as any, isAdmin }
}

export const SPECIES: Record<string, string> = { dog: 'Perro', cat: 'Gato', other: 'Otro' }
export const SEX: Record<string, string> = { male: 'Macho', female: 'Hembra', unknown: 'Sin definir' }

export function ageText(birth?: string | null) {
  if (!birth) return '—'
  const b = new Date(birth)
  const now = new Date()
  let months = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth()
  if (now.getDate() < b.getDate()) months--
  if (months < 1) return 'menos de 1 mes'
  if (months < 24) return `${months} meses`
  return `${Math.floor(months / 12)} años`
}
