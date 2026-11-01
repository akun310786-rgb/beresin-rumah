import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_TIMES = ['Pagi (08.00–12.00)', 'Siang (12.00–16.00)'];

export async function POST(req: Request) {
  const form = await req.formData();
  const v = Object.fromEntries(form.entries());
  const name = String(v.customer_name || '').trim();
  const phone = String(v.phone || '').trim();
  const pkg = String(v.package_name || '').trim();
  const date = String(v.visit_date || '').trim();
  const visitTime = String(v.visit_time || '').trim();
  const address = String(v.address || '').trim();
  const notes = String(v.notes || '').trim();

  if (!name || !phone || !address || !pkg || !date || !visitTime) {
    return NextResponse.json({ error: 'Lengkapi semua field wajib.' }, { status: 400 });
  }
  if (!ALLOWED_TIMES.includes(visitTime)) {
    return NextResponse.json({ error: 'Waktu kunjungan tidak valid.' }, { status: 400 });
  }
  // Validasi tanggal (zona WIB)
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  today.setHours(0, 0, 0, 0);
  const chosen = new Date(date + 'T00:00:00+07:00');
  if (Number.isNaN(chosen.getTime()) || chosen < today) {
    return NextResponse.json({ error: 'Pilih tanggal hari ini atau setelahnya.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: service, error: svcErr } = await supabase
    .from('service_packages')
    .select('id, price, active')
    .eq('name', pkg)
    .single();
  if (svcErr || !service || !service.active) {
    return NextResponse.json({ error: 'Paket tidak ditemukan atau nonaktif.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_name: name,
      phone,
      address,
      package_id: service.id,
      package_name: pkg,
      price: service.price,
      visit_date: date,
      visit_time: visitTime,
      notes,
      status: 'Baru',
      payment_status: 'Belum dibayar',
    })
    .select('code')
    .single();

  if (error) {
    console.error('order insert error', error);
    return NextResponse.json(
      { error: 'Pesanan gagal disimpan. Pastikan migrasi database telah dijalankan.' },
      { status: 500 }
    );
  }
  return NextResponse.redirect(new URL('/pesan/berhasil?kode=' + data.code, req.url), 303);
}
