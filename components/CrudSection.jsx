'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fmtDate } from '@/lib/utils';

const blank = (fields) => Object.fromEntries(fields.map((f) => [f.key, f.default ?? '']));

export default function CrudSection({
  title, table, readFrom, petId, fields, order, canWrite = true, extraCols = [], rowActions = [], reloadKey, onChange
}) {
  const [rows, setRows] = useState([]);
  const [opts, setOpts] = useState({});
  const [form, setForm] = useState(blank(fields));
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    let q = supabase.from(readFrom || table).select('*');
    if (petId) q = q.eq('pet_id', petId);
    if (order) q = q.order(order.col, { ascending: !!order.asc });
    const { data, error } = await q;
    if (error) setErr(error.message); else setRows(data || []);
  }, [readFrom, table, petId, order?.col, order?.asc]);

  useEffect(() => { load(); }, [load, reloadKey]);

  useEffect(() => {
    fields.filter((f) => f.from).forEach(async (f) => {
      let oq = supabase.from(f.from.table).select(`${f.from.value},${f.from.label}`).order(f.from.label);
      if (f.from.in) oq = oq.in(f.from.in[0], f.from.in[1]);
      const { data } = await oq;
      setOpts((o) => ({ ...o, [f.key]: data || [] }));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const show = (f, row) => {
    const v = row[f.key];
    if (v === null || v === undefined || v === '') return '—';
    if (f.type === 'date') return fmtDate(v);
    if (f.type === 'datetime') return new Date(v).toLocaleString('es-CL');
    if (f.from) return (opts[f.key] || []).find((o) => String(o[f.from.value]) === String(v))?.[f.from.label] ?? v;
    if (f.options) return f.options.find((o) => o[0] === v)?.[1] ?? v;
    return String(v);
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const payload = {};
    if (petId) payload.pet_id = petId;
    fields.forEach((f) => {
      let v = form[f.key];
      if (v === '' || v === undefined) v = null;
      else if (f.type === 'number') v = Number(v);
      payload[f.key] = v;
    });
    const { error } = await supabase.from(table).insert(payload);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setForm(blank(fields)); setOpen(false);
    await load(); onChange?.();
  }

  async function remove(row) {
    if (!confirm('¿Eliminar este registro?')) return;
    const { error } = await supabase.from(table).delete().eq('id', row.id);
    if (error) setErr(error.message); else { await load(); onChange?.(); }
  }

  const input = (f) => {
    const common = { className: 'input', required: f.required, value: form[f.key], onChange: (e) => setForm({ ...form, [f.key]: e.target.value }) };
    if (f.from) return (
      <select {...common}><option value="">Seleccionar…</option>
        {(opts[f.key] || []).map((o) => <option key={o[f.from.value]} value={o[f.from.value]}>{o[f.from.label]}</option>)}
      </select>
    );
    if (f.options) return (
      <select {...common}><option value="">Seleccionar…</option>
        {f.options.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
      </select>
    );
    if (f.type === 'textarea') return <textarea rows={2} {...common} />;
    const type = f.type === 'datetime' ? 'datetime-local' : f.type || 'text';
    return <input type={type} step={f.step} min={f.min} {...common} />;
  };

  const cols = fields.filter((f) => !f.hide);

  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {canWrite && <button className="btn-ghost no-print" onClick={() => setOpen(!open)}>{open ? 'Cancelar' : '+ Agregar'}</button>}
      </div>
      {err && <p className="mb-2 rounded bg-red-50 p-2 text-xs text-red-700">{err}</p>}
      {open && (
        <form onSubmit={submit} className="mb-4 grid gap-3 rounded-lg bg-stone-50 p-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <label className="label">{f.label}{f.required && ' *'}</label>
              {input(f)}
            </div>
          ))}
          <div className="sm:col-span-2"><button className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></div>
        </form>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">Sin registros todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-stone-500">
              <tr>
                {cols.map((f) => <th key={f.key} className="px-2 py-1">{f.label}</th>)}
                {extraCols.map((c) => <th key={c.label} className="px-2 py-1">{c.label}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-stone-100">
                  {cols.map((f) => <td key={f.key} className="px-2 py-2">{show(f, r)}</td>)}
                  {extraCols.map((c) => <td key={c.label} className="px-2 py-2">{c.render(r)}</td>)}
                  <td className="whitespace-nowrap px-2 py-2 text-right no-print">
                    {canWrite && rowActions.filter((a) => a.show(r)).map((a) => (
                      <button key={a.label} className="mr-3 text-xs text-brand-700 hover:underline"
                        onClick={async () => { const { error } = await a.run(r); if (error) setErr(error.message); await load(); onChange?.(); }}>
                        {a.label}
                      </button>
                    ))}
                    {canWrite && <button className="btn-danger" onClick={() => remove(r)}>Eliminar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
