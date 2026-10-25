import { addRow, deleteRow, markApplied } from '@/app/actions';
import { displayValue, type Section } from '@/lib/sections';
import { fmtDate, today, addDays } from '@/lib/format';

const isDate = (k: string) => /date|_on$|scheduled|applied/.test(k);

export default function SectionView({ s, rows, petId, canWrite, vaccineTypes, readOnlyView }: {
  s: Section; rows: any[]; petId: string; canWrite: boolean; vaccineTypes?: any[]; readOnlyView?: boolean;
}) {
  const t = today(), soon = addDays(30);
  return (
    <section className="card">
      <h2>{s.title}</h2>
      {rows.length === 0 ? <p className="sub" style={{ marginTop: '.5rem' }}>{s.empty}</p> : (
        <div className="scroll"><table>
          <thead><tr>{s.cols.map((c) => <th key={c.key}>{c.label}</th>)}{!readOnlyView && <th className="noprint" />}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {s.cols.map((c) => (
                  <td key={c.key}>
                    {c.key === 'status'
                      ? r.applied_date ? <span className="badge b-ok">Aplicada</span>
                        : r.scheduled_date < t ? <span className="badge b-over">Vencida</span>
                        : r.scheduled_date <= soon ? <span className="badge b-soon">Próxima</span>
                        : <span className="badge b-plain">Programada</span>
                      : isDate(c.key) ? fmtDate(r[c.key]) : displayValue(s, c.key, r)}
                  </td>
                ))}
                {!readOnlyView && (
                  <td className="noprint" style={{ whiteSpace: 'nowrap' }}>
                    {s.key === 'vaccinations' && !r.applied_date && canWrite && (
                      <form action={markApplied.bind(null, petId, r.id)} style={{ display: 'inline' }}><button className="btn sm">Marcar aplicada</button></form>
                    )}{' '}
                    {canWrite && <form action={deleteRow.bind(null, s.key, petId, r.id)} style={{ display: 'inline' }}><button className="btn danger sm" aria-label="Eliminar registro">Eliminar</button></form>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {!readOnlyView && canWrite && (
        <details style={{ marginTop: '.9rem' }}>
          <summary>Agregar registro</summary>
          <form action={addRow.bind(null, s.key, petId)} className="f">
            {s.fields.map((f) => (
              <label key={f.name} className={f.type === 'textarea' ? 'wide' : undefined}>{f.label}{f.required ? ' *' : ''}
                {f.type === 'textarea' ? <textarea name={f.name} />
                  : f.type === 'select' ? (
                    <select name={f.name} required={f.required} defaultValue="">
                      <option value="" disabled={f.required}>{f.required ? 'Selecciona…' : 'Sin especificar'}</option>
                      {(f.optionsFrom === 'vaccine_types' ? (vaccineTypes ?? []).map((v) => ({ value: String(v.id), label: v.name })) : f.options!).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <input name={f.name} type={f.type} step={f.step} required={f.required} min={f.type === 'number' ? 0 : undefined} />}
              </label>
            ))}
            <div className="wide"><button className="btn">Guardar</button></div>
          </form>
        </details>
      )}
      {!readOnlyView && !canWrite && s.adminOnly && <p className="sub" style={{ marginTop: '.6rem' }}>Solo el equipo veterinario puede modificar estos registros.</p>}
    </section>
  );
}
