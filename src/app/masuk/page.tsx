'use client';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (input.trim().startsWith('+')) return input.trim();
  if (digits.startsWith('62')) return '+' + digits;
  if (digits.startsWith('0')) return '+62' + digits.slice(1);
  return '+' + digits;
}

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const s = createClient();
    const { error: signInErr } = await s.auth.signInWithPassword({
      phone: normalizePhone(phone),
      password,
    });
    if (signInErr) {
      setError('Nomor telepon atau kata sandi tidak valid.');
      setBusy(false);
      return;
    }
    const { data, error: profileErr } = await s.from('profiles').select('role').single();
    if (profileErr) {
      setError('Gagal memuat profil. Hubungi admin.');
      setBusy(false);
      return;
    }
    location.href = data?.role === 'admin' ? '/dashboard/admin' : '/dashboard/pekerja';
  }

  return (
    <main className="login">
      <form onSubmit={submit}>
        <a href="/">← Beranda</a>
        <h1>Masuk</h1>
        <p>Gunakan nomor telepon dan kata sandi akun.</p>
        <input
          placeholder="Nomor telepon (08...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn" disabled={busy}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
