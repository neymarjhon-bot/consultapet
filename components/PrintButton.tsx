'use client';
export default function PrintButton() {
  return <button className="btn ghost noprint" onClick={() => window.print()}>Imprimir / guardar PDF</button>;
}
