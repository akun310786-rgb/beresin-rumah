-- 003: security hardening based on advisors
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at := now(); return new; end;
$$;

-- Revoke direct RPC execution of trigger/internal functions
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_assignment_fields() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;