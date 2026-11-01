-- 004: performance (indexes + RLS initplan)
-- FK covering indexes
create index if not exists order_expenses_order_id_idx on public.order_expenses(order_id);
create index if not exists orders_package_id_idx on public.orders(package_id);
create index if not exists reviews_order_id_idx on public.reviews(order_id);

-- Recreate policies with (select ...) to avoid per-row re-eval
-- profiles
drop policy if exists "profiles self or admin read" on public.profiles;
drop policy if exists "admin profile management" on public.profiles;
create policy "profiles self or admin read" on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.has_role('admin')));
create policy "admin profile management" on public.profiles for all to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- workers
drop policy if exists "workers self or admin" on public.workers;
drop policy if exists "admin worker management" on public.workers;
create policy "workers self or admin" on public.workers for select to authenticated using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy "admin worker management" on public.workers for all to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- service_packages
drop policy if exists "packages public read" on public.service_packages;
drop policy if exists "admin package management" on public.service_packages;
create policy "packages public read" on public.service_packages for select using (active or (select public.has_role('admin')));
create policy "admin package management" on public.service_packages for all to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- orders
drop policy if exists "order insert public" on public.orders;
drop policy if exists "admin all orders" on public.orders;
drop policy if exists "worker assigned order read" on public.orders;
create policy "order insert public" on public.orders for insert to anon,authenticated with check (status='Baru' and payment_status='Belum dibayar');
create policy "admin all orders" on public.orders for all to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "worker assigned order read" on public.orders for select to authenticated using (exists (select 1 from public.order_assignments a where a.order_id = id and a.worker_id = (select auth.uid())));

-- order_assignments
drop policy if exists "assignment admin full" on public.order_assignments;
drop policy if exists "worker assigned read" on public.order_assignments;
drop policy if exists "worker checklist update" on public.order_assignments;
create policy "assignment admin full" on public.order_assignments for all to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "worker assigned read" on public.order_assignments for select to authenticated using (worker_id = (select auth.uid()));
create policy "worker checklist update" on public.order_assignments for update to authenticated using (worker_id = (select auth.uid())) with check (worker_id = (select auth.uid()));

-- order_expenses
drop policy if exists "expense admin only" on public.order_expenses;
create policy "expense admin only" on public.order_expenses for all to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- worker_applications
drop policy if exists "application public submit" on public.worker_applications;
drop policy if exists "application admin manage" on public.worker_applications;
create policy "application public submit" on public.worker_applications for insert to anon,authenticated with check (status='Menunggu');
create policy "application admin manage" on public.worker_applications for all to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- reviews
drop policy if exists "reviews public read" on public.reviews;
drop policy if exists "reviews public submit" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);
create policy "reviews public submit" on public.reviews for insert to anon,authenticated with check (rating between 1 and 5);