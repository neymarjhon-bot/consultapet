import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { createClient } from '@/lib/supabase/server'
import { loadHistory, safeName } from '@/lib/history'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })
  const h = await loadHistory(supabase, id)
  if (!h) return new Response('No encontrada', { status: 404 })

  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text(`Historial de ${h.pet.name}`, 14, 18)
  doc.setFontSize(9)
  doc.text(`Generado el ${new Date().toISOString().slice(0, 10)} · ConsultaPet`, 14, 24)
  autoTable(doc, { startY: 30, body: h.info, theme: 'plain', styles: { fontSize: 10 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } } })

  for (const s of h.sections) {
    if (s.rows.length === 0) continue
    const y = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(12)
    doc.text(s.title, 14, y)
    autoTable(doc, { startY: y + 2, head: [s.headers], body: s.rows, headStyles: { fillColor: [47, 107, 79] }, styles: { fontSize: 9 } })
  }
  const buf = Buffer.from(doc.output('arraybuffer'))
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="historial-${safeName(h.pet.name)}.pdf"`,
    },
  })
}
