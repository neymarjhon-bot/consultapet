import ExcelJS from 'exceljs'
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

  const wb = new ExcelJS.Workbook()
  wb.creator = 'ConsultaPet'
  const resumen = wb.addWorksheet('Ficha')
  resumen.columns = [{ width: 24 }, { width: 50 }]
  h.info.forEach(([k, v]) => resumen.addRow([k, v]).getCell(1).font = { bold: true })

  for (const s of h.sections) {
    const ws = wb.addWorksheet(s.title.slice(0, 31))
    ws.addRow(s.headers).font = { bold: true }
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3EFE6' } }
    s.rows.forEach((r) => ws.addRow(r))
    ws.columns.forEach((c) => (c.width = 24))
  }
  const buf = await wb.xlsx.writeBuffer()
  return new Response(buf as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="historial-${safeName(h.pet.name)}.xlsx"`,
    },
  })
}
