import { addRecord, deleteRecord } from '@/app/pets/actions'
import type { Section } from '@/lib/sections'

type Opt = { value: string; label: string }

export default function SectionCard({ petId, tab, section, rows, canWrite, dynamicOptions }: {
  petId: string; tab: string; section: Section; rows: any[]; canWrite: boolean; dynamicOptions: Record<string, Opt[]>
}) {
  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-semibold">{section.title}</h2>
        {section.hint && <p className="text-xs text-pine-700">{section.hint}</p>}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-pine-700">Sin registros todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-pine-100 text-xs text-pine-700">
              {section.cols.map((c) => <th key={c.label} className="py-1 pr-3 font-medium">{c.label}</th>)}
              {canWrite && <th />}
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-pine-50 last:border-0">
                  {section.cols.map((c) => {
                    const v = c.get(r)
                    const cls = v === 'Vencida' ? 'font-medium text-brick-600' : v.startsWith('Aplicada') ? 'text-pine-600' : v === 'Pendiente' ? 'text-amber-600' : ''
                    return <td key={c.label} className={`py-2 pr-3 ${cls}`}>{v}</td>
                  })}
                  {canWrite && (
                    <td className="py-2 text-right">
                      <form action={deleteRecord}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="pet_id" value={petId} />
                        <input type="hidden" name="tab" value={tab} />
                        <input type="hidden" name="section" value={section.key} />
                        <button className="btn-danger" aria-label="Eliminar registro">Eliminar</button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canWrite && (
        <details className="rounded-lg bg-pine-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-pine-700">Agregar registro</summary>
          <form action={addRecord} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="pet_id" value={petId} />
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="section" value={section.key} />
            {section.fields.map((f) => {
              const id = `${section.key}-${f.name}`
              const opts = f.options ?? (f.optionsFrom ? dynamicOptions[f.optionsFrom] : undefined) ?? []
              return (
                <div key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="label" htmlFor={id}>{f.label}{f.required ? ' *' : ''}</label>
                  {f.type === 'select' ? (
                    <select id={id} name={f.name} required={f.required} className="input">
                      <option value="">—</option>
                      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea id={id} name={f.name} rows={2} className="input" />
                  ) : (
                    <input id={id} name={f.name} type={f.type} step={f.step} required={f.required} className="input" />
                  )}
                </div>
              )
            })}
            <div className="sm:col-span-2"><button className="btn">Guardar</button></div>
          </form>
        </details>
      )}
    </section>
  )
}
