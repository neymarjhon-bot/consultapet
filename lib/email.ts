import 'server-only';
import nodemailer from 'nodemailer';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fmtDate } from '@/lib/format';

export type NoticeKind = 'vaccine_scheduled' | 'next_dose' | 'vaccine_7d' | 'vaccine_1d';

export const SITE_URL = (process.env.SITE_URL || 'https://consultapet-kappa.vercel.app').replace(/\/$/, '');

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
  }
  return transporter;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function buildVaccineEmail(kind: NoticeKind, d: { ownerName: string; petName: string; vaccine: string; date: string; petId: string }) {
  const fecha = fmtDate(d.date);
  const titles: Record<NoticeKind, string> = {
    vaccine_scheduled: `Vacuna agendada para ${d.petName}`,
    next_dose: `Próxima dosis programada para ${d.petName}`,
    vaccine_7d: `Recordatorio: vacuna de ${d.petName} en 7 días`,
    vaccine_1d: `Recordatorio: vacuna de ${d.petName} mañana`,
  };
  const intro: Record<NoticeKind, string> = {
    vaccine_scheduled: 'El equipo veterinario agendó una vacuna para tu mascota.',
    next_dose: 'Se registró la vacuna aplicada a tu mascota y quedó programado su próximo refuerzo.',
    vaccine_7d: 'Te recordamos que en 7 días corresponde la siguiente vacuna de tu mascota.',
    vaccine_1d: 'Te recordamos que mañana corresponde la siguiente vacuna de tu mascota.',
  };
  const link = `${SITE_URL}/pets/${d.petId}?tab=vacunas`;
  const subject = titles[kind];
  const text = `Hola ${d.ownerName}:\n\n${intro[kind]}\n\nMascota: ${d.petName}\nVacuna: ${d.vaccine}\nFecha: ${fecha}\n\nPuedes ver el calendario en ${link}\n\nConsultaPet 360\nSi no quieres recibir estos avisos, desactívalos en "Mi perfil".`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;color:#12201A">
  <h2 style="color:#0F5C4D;margin:0 0 12px">ConsultaPet 360</h2>
  <p>Hola ${esc(d.ownerName)}:</p>
  <p>${esc(intro[kind])}</p>
  <table style="border-collapse:collapse;margin:12px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#5A6A62">Mascota</td><td><b>${esc(d.petName)}</b></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#5A6A62">Vacuna</td><td><b>${esc(d.vaccine)}</b></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#5A6A62">Fecha</td><td><b>${esc(fecha)}</b></td></tr>
  </table>
  <p><a href="${link}" style="background:#0F5C4D;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Ver calendario de vacunas</a></p>
  <p style="font-size:12px;color:#5A6A62;margin-top:20px">Si no quieres recibir estos avisos, desactívalos en “Mi perfil”.</p>
</div>`;
  return { subject, text, html };
}

/**
 * Envía el aviso de una vacuna al dueño y lo registra en la tabla notifications.
 * Nunca lanza error: si el correo falla, queda registrado como "failed" y la acción del usuario continúa.
 */
export async function notifyVaccine(supabase: SupabaseClient, vaccinationId: string, kind: NoticeKind): Promise<'sent' | 'failed' | 'skipped'> {
  try {
    const { data: v } = await supabase
      .from('vaccinations')
      .select('id, scheduled_date, applied_date, pet_id, vaccine_types(name), pets(name, owner_id, owner:owner_id(full_name, email))')
      .eq('id', vaccinationId)
      .maybeSingle();
    const pet: any = (v as any)?.pets;
    const owner: any = pet?.owner;
    if (!v || v.applied_date || !owner?.email) return 'skipped';
    // preferencias y consentimiento del dueño (si no las ha configurado, los avisos están activos)
    const { data: pref } = await supabase.from('notification_preferences')
      .select('email_enabled, remind_7d, remind_1d').eq('owner_id', pet.owner_id).maybeSingle();
    if (pref && (!pref.email_enabled || (kind === 'vaccine_7d' && !pref.remind_7d) || (kind === 'vaccine_1d' && !pref.remind_1d))) return 'skipped';

    const mail = buildVaccineEmail(kind, {
      ownerName: owner.full_name || 'dueño',
      petName: pet.name,
      vaccine: (v as any).vaccine_types?.name ?? 'Vacuna',
      date: v.scheduled_date,
      petId: v.pet_id,
    });

    let status: 'sent' | 'failed' = 'sent', error: string | null = null;
    const t = getTransporter();
    if (!t) { status = 'failed'; error = 'Correo no configurado (faltan GMAIL_USER y GMAIL_APP_PASSWORD)'; }
    else {
      try {
        await t.sendMail({ from: `ConsultaPet 360 <${process.env.GMAIL_USER}>`, to: owner.email, subject: mail.subject, text: mail.text, html: mail.html });
      } catch (e: any) { status = 'failed'; error = String(e?.message ?? e).slice(0, 300); }
    }
    // registro del envío (si ya existía uno del mismo tipo para esta vacuna, la base lo ignora por la restricción única)
    await supabase.from('notifications').insert({
      owner_id: pet.owner_id, vaccination_id: v.id, kind, to_email: owner.email,
      status, attempts: 1, last_error: error, sent_at: status === 'sent' ? new Date().toISOString() : null,
    });
    return status;
  } catch {
    return 'failed';
  }
}
