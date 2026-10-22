import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { loadHistory, toSections } from "@/lib/history";

export const runtime = "nodejs";

const clean = (s: string) => s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";
  const year = req.nextUrl.searchParams.get("year") || undefined;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });
  const h = await loadHistory(supabase, id);
  if (!h.pet) return new NextResponse("No encontrada", { status: 404 });
  const sections = toSections(h, year);
  const base = `historial-${String(h.pet.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}${year ? `-${year}` : ""}`;

  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    for (const s of sections) {
      const ws = wb.addWorksheet(s.title.slice(0, 31));
      ws.addRow(s.columns).font = { bold: true };
      s.rows.forEach((r) => ws.addRow(r));
      ws.columns.forEach((c) => { c.width = 22; });
    }
    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
      },
    });
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595, H = 842, M = 48, maxChars = 95;
  let page = pdf.addPage([W, H]);
  let y = H - M;
  const line = (text: string, size = 10, f = font, color = rgb(0.08, 0.13, 0.12)) => {
    const words = clean(text).split(" ");
    let cur = "";
    const flush = () => {
      if (y < M) { page = pdf.addPage([W, H]); y = H - M; }
      page.drawText(cur, { x: M, y, size, font: f, color });
      y -= size + 4; cur = "";
    };
    for (const w of words) {
      if ((cur + " " + w).length > maxChars && cur) flush();
      cur = cur ? `${cur} ${w}` : w;
    }
    flush();
  };
  line(`Historial de ${h.pet.name}${year ? ` (${year})` : ""}`, 20, bold, rgb(0.12, 0.24, 0.21));
  line(`Generado el ${new Date().toISOString().slice(0, 10)}`, 9);
  y -= 8;
  for (const s of sections) {
    if (!s.rows.length) continue;
    y -= 6;
    line(s.title, 13, bold, rgb(0.12, 0.24, 0.21));
    for (const r of s.rows) {
      if (s.title === "Datos") line(`${r[0]}: ${r[1] || "-"}`);
      else line(r.map((c, i) => (c ? `${s.columns[i]}: ${c}` : "")).filter(Boolean).join(" | "));
    }
  }
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${base}.pdf"` },
  });
}
