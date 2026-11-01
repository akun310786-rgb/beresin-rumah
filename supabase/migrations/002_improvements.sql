-- 002: improvements
alter table public.profiles alter column phone drop not null;

-- Auto-create profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', nullif(new.email,''), 'Pengguna'),
    nullif(new.phone, ''),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'worker')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Protect sensitive assignment columns from non-admin updates
create or replace function public.protect_assignment_fields()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role('admin') then
    new.wage := old.wage;
    new.assigned_at := old.assigned_at;
    new.worker_id := old.worker_id;
    new.order_id := old.order_id;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_assignment_fields_trg on public.order_assignments;
create trigger protect_assignment_fields_trg
  before update on public.order_assignments
  for each row execute function public.protect_assignment_fields();

-- Touch updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists service_packages_touch_updated_at on public.service_packages;
create trigger service_packages_touch_updated_at
  before update on public.service_packages
  for each row execute function public.touch_updated_at();

-- Indexes
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
create index if not exists assignments_worker_idx on public.order_assignments(worker_id);
create index if not exists assignments_order_idx on public.order_assignments(order_id);
