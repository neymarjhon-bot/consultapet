import { supabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export async function POST(req) {
  await supabaseServer().auth.signOut();
  return NextResponse.redirect(new URL('/login', req.url), { status: 303 });
}
