'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Assignment = {
  id: string;
  wage: number;
  checklist_before: string[] | null;
  checklist_after: string[] | null;
  orders: {
    package_name: string;
    code: string;
    visit_date: string;
    visit_time: string;
    address: string;
    notes: string | null;
  } | null;
};

export default function Worker() {
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const db = createClient();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await db.auth.getUser();
      if (!user) { location.href = '/masuk'; return; }
      const { data, error: e } = await db
        .from('order_assignments')
        .select('id,wage,checklist_before,checklist_after,orders(package_name,code,visit_date,visit_time,address,notes)')
        .eq('worker_id', user.id);
      if (e) throw e;
      const normalized = (data || []).map((row: any) => ({
        ...row,
        orders: Array.isArray(row.orders) ? (row.orders[0] ?? null) : row.orders,
      }));
      setTasks(normalized as unknown as Assignment[]);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat tugas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function update(id: string, values: Record<string, unknown>) {
    const { error: e } = await db.from('order_assignments').update(values).eq('id', id);
    if (e) { setError(e.message); return; }
    await load();
  }

  async function logout() {
    await db.auth.signOut();
    location.href = '/masuk';
  }

  return (
    <main className="dashboard">
      <header>
        <a href="/">⌂ Beresin Rumah</a>
        <button onClick={logout}>Keluar</button>
      </header>
      <h1>Portal Pekerja</h1>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      {loading && <p>Memuat…</p>}
      {tasks.length === 0 && !loading && <p>Belum ada tugas yang ditugaskan.</p>}
      {tasks.map((a) => (
        <article className="task" key={a.id}>
          <h2>{a.orders?.package_name} · {a.orders?.code}</h2>
          <p>{a.orders?.visit_date} · {a.orders?.visit_time}</p>
          <p>{a.orders?.address}</p>
          <p>Catatan: {a.orders?.notes || '—'}</p>
          <p>Upah tercatat: Rp{(a.wage || 0).toLocaleString('id-ID')}</p>
          <Checklist
            title="Checklist sebelum pekerjaan"
            values={a.checklist_before || []}
            save={(v) => update(a.id, { checklist_before: v })}
          />
          <Checklist
            title="Checklist sesudah pekerjaan"
            values={a.checklist_after || []}
            save={(v) => update(a.id, { checklist_after: v })}
          />
          <button className="btn" onClick={() => update(a.id, { checklist_after: ['Pekerjaan selesai'] })}>
            Tandai selesai
          </button>
        </article>
      ))}
    </main>
  );
}

function Checklist({
  title,
  values,
  save,
}: {
  title: string;
  values: string[];
  save: (v: string[]) => void;
}) {
  const [v, setV] = useState<string[]>(values || []);
  return (
    <fieldset>
      <legend>{title}</legend>
      {['Sapu/lantai atau layanan sesuai paket', 'Area kerja diperiksa bersama pelanggan', 'Kondisi sebelum/sesudah dicatat'].map((x) => (
        <label key={x}>
          <input
            type="checkbox"
            checked={v.includes(x)}
            onChange={(e) => {
              const n = e.target.checked ? [...v, x] : v.filter((y) => y !== x);
              setV(n);
              save(n);
            }}
          />
          {x}
        </label>
      ))}
    </fieldset>
  );
}
