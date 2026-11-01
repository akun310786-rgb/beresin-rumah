'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function WorkerApplication() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Ciamis');
  const [experience, setExperience] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const db = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !area.trim()) return;
    setBusy(true); setMsg('');
    const { error } = await db.from('worker_applications').insert({
      name: name.trim(), phone: phone.trim(), area: area.trim(), experience: experience.trim(),
    });
    if (error) { setMsg('Gagal mengirim aplikasi.'); setBusy(false); return; }
    setName(''); setPhone(''); setExperience('');
    setMsg('Aplikasi terkirim. Kami akan menghubungi Anda.');
    setBusy(false);
  }

  return (
    <section id="gabung" style={{ maxWidth: 1120, margin: '65px auto', padding: '0 20px' }}>
      <h2>Gabung Sebagai Pekerja</h2>
      <p>Tertarik bergabung dengan tim Beresin Rumah? Kirim aplikasi Anda.</p>
      <form onSubmit={submit} className="formgrid" style={{ maxWidth: 600 }}>
        <input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Nomor WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          <option>Ciamis</option>
          <option>Tasikmalaya</option>
          <option>Banjar</option>
        </select>
        <textarea placeholder="Pengalaman (opsional)" value={experience} onChange={(e) => setExperience(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim aplikasi'}</button>
        {msg && <p>{msg}</p>}
      </form>
    </section>
  );
}
