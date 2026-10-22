import { addRecord, deleteRecord } from "@/app/actions";

export function Del({ table, petId, id }: { table: string; petId: string; id: string }) {
  return (
    <form action={deleteRecord.bind(null, table, petId, id)}>
      <button className="text-xs underline text-alert" aria-label="Quitar registro">Quitar</button>
    </form>
  );
}

export function RecordForm({ table, petId, children, label = "Guardar" }:
  { table: string; petId: string; children: React.ReactNode; label?: string }) {
  return (
    <form action={addRecord.bind(null, table, petId)} className="grid gap-3 sm:grid-cols-2 bg-white p-4 rounded-md border border-[#dbe5e1] mt-3">
      {children}
      <button className="btn sm:col-span-2">{label}</button>
    </form>
  );
}

export function Item({ children, petId, table, id, canDelete }:
  { children: React.ReactNode; petId: string; table: string; id: string; canDelete: boolean }) {
  return (
    <li className="bg-white rounded-md p-3 border border-[#dbe5e1] text-sm flex justify-between gap-3">
      <div>{children}</div>
      {canDelete && <Del table={table} petId={petId} id={id} />}
    </li>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <li className="text-sm text-ink/70">{children}</li>;
}

export function Lbl({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="text-sm block">{t}<div className="mt-1">{children}</div></label>;
}
