'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Review = { id: string; name: string; rating: number; comment: string; created_at: string };

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const db = createClient();

  async function load() {
    const { data } = await db.from('reviews').select('id,name,rating,comment,created_at').order('created_at', { ascending: false }).limit(10);
    setReviews((data as Review[]) || []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    setBusy(true); setMsg('');
    const { error } = await db.from('reviews').insert({ name: name.trim(), rating, comment: comment.trim() });
    if (error) { setMsg('Gagal mengirim ulasan.'); setBusy(false); return; }
    setName(''); setComment(''); setRating(5);
    setMsg('Terima kasih atas ulasan Anda!');
    await load();
    setBusy(false);
  }

  return (
    <section id="ulasan" style={{ maxWidth: 1120, margin: '65px auto', padding: '0 20px' }}>
      <h2>Ulasan Pelanggan</h2>
      <div className="cards" style={{ marginBottom: 24 }}>
        {reviews.length === 0 && <p>Belum ada ulasan.</p>}
        {reviews.map((r) => (
          <article key={r.id}>
            <strong>{'★'.repeat(r.rating)}</strong>
            <p>{r.comment}</p>
            <small>{r.name} · {new Date(r.created_at).toLocaleDateString('id-ID')}</small>
          </article>
        ))}
      </div>
      <form onSubmit={submit} className="formgrid" style={{ maxWidth: 600 }}>
        <input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} required />
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} bintang</option>)}
        </select>
        <textarea placeholder="Komentar" value={comment} onChange={(e) => setComment(e.target.value)} required />
        <button className="btn" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim ulasan'}</button>
        {msg && <p>{msg}</p>}
      </form>
    </section>
  );
}
