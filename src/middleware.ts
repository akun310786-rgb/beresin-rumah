import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(items: { name: string; value: string; options?: CookieOptions }[]) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const u = request.nextUrl.clone();
      u.pathname = '/masuk';
      return NextResponse.redirect(u);
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = profile?.role;
    if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
      const u = request.nextUrl.clone();
      u.pathname = role === 'worker' ? '/dashboard/pekerja' : '/masuk';
      return NextResponse.redirect(u);
    }
    if (pathname.startsWith('/dashboard/pekerja') && role !== 'worker') {
      const u = request.nextUrl.clone();
      u.pathname = role === 'admin' ? '/dashboard/admin' : '/masuk';
      return NextResponse.redirect(u);
    }
  }
  return response;
}

export const config = { matcher: ['/dashboard/:path*'] };
