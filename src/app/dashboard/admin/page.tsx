'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Order = {
  id: string;
  code: string;
  customer_name: string;
  phone: string;
  address: string;
  package_name: string;
  price: number;
  visit_date: string;
  visit_time: string;
  status: string;
  payment_status: string;
};

type Worker = { user_id: string; name: string };

type Stats = { revenue: number; costs: number; margin: number };

const ORDER_STATUSES = ['Baru','Menunggu konfirmasi','Dikonfirmasi','Pekerja ditugaskan','Dalam pengerjaan','Selesai','Dibatalkan','Perlu tindak lanjut'];
const PAYMENT_STATUSES = ['Belum dibayar','DP','Lunas','Refund'];

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [stats, setStats] = useState<Stats>({ revenue: 0, costs: 0, margin: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignWage, setAssignWage] = useState<Record<string, number>>({});
  const db = createClient();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data, error: e1 } = await db.from('orders').select('*').order('created_at', { ascending: false });
      if (e1) throw e1;
      setOrders((data as Order[]) || []);
      const { data: w, error: e2 } = await db.from('workers').select('user_id,profiles(name)').eq('verified', true);
      if (e2) throw e2;
      setWorkers(
        (w || []).map((x: any) => ({ user_id: x.user_id, name: x.profiles?.name || 'Pekerja' }))
      );
      const { data: ex } = await db.from('order_expenses').select('amount');
      const { data: as } = await db.from('order_assignments').select('wage');
      const revenue = (data || [])
        .filter((x: any) => x.payment_status === 'Lunas')
        .reduce((a: number, x: any) => a + x.price, 0);
      const costs =
        (ex || []).reduce((a: number, x: any) => a + (x.amount || 0), 0) +
        (as || []).reduce((a: number, x: any) => a + (x.wage || 0), 0);
      setStats({ revenue, costs, margin: revenue - costs });
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function upd(id: string, values: Record<string, unknown>) {
    const { error: e } = await db.from('orders').update(values).eq('id', id);
    if (e) { setError(e.message); return; }
    await load();
  }

  async function assign(order_id: string, worker_id: string) {
    if (!worker_id) return;
    const wage = assignWage[order_id] || 0;
    const { error: e } = await db.from('order_assignments').insert({ order_id, worker_id, wage });
    if (e) { setError(e.message); return; }
    await upd(order_id, { status: 'Pekerja ditugaskan' });
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
      <h1>Dashboard Admin</h1>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      <div className="stats">
        <article>Order masuk<b>{orders.length}</b></article>
        <article>Pendapatan lunas<b>Rp{stats.revenue.toLocaleString('id-ID')}</b></article>
        <article>Biaya langsung<b>Rp{stats.costs.toLocaleString('id-ID')}</b></article>
        <article>Margin kontribusi<b>Rp{stats.margin.toLocaleString('id-ID')}</b></article>
      </div>
      <h2>Pesanan {loading && '(memuat…)'}</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Order / Pelanggan</th>
              <th>Paket &amp; jadwal</th>
              <th>Status</th>
              <th>Pekerja</th>
              <th>Pembayaran</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <b>{o.code}</b>
                  <br />
                  {o.customer_name}
                  <br />
                  {o.phone}
                  <br />
                  <small>{o.address}</small>
                </td>
                <td>
                  {o.package_name} · Rp{o.price.toLocaleString('id-ID')}
                  <br />
                  {o.visit_date} {o.visit_time}
                </td>
                <td>
                  <select value={o.status} onChange={(e) => upd(o.id, { status: e.target.value })}>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Upah"
                    style={{ width: 80, marginBottom: 4 }}
                    value={assignWage[o.id] ?? 0}
                    onChange={(e) =>
                      setAssignWage((p) => ({ ...p, [o.id]: Number(e.target.value) }))
                    }
                  />
                  <select defaultValue="" onChange={(e) => assign(o.id, e.target.value)}>
                    <option value="">Tugaskan…</option>
                    {workers.map((w) => (
                      <option key={w.user_id} value={w.user_id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={o.payment_status}
                    onChange={(e) => upd(o.id, { payment_status: e.target.value })}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
