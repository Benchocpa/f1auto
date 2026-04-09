create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users
    where auth_user_id = auth.uid()
      and role = 'admin'
      and coalesce(is_blocked, false) = false
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.vehicles enable row level security;
alter table public.attendance_entries enable row level security;
alter table public.employees enable row level security;
alter table public.payroll_closures enable row level security;
alter table public.stores enable row level security;
alter table public.app_users enable row level security;

drop policy if exists vehicles_authenticated_select on public.vehicles;
drop policy if exists vehicles_authenticated_insert on public.vehicles;
drop policy if exists vehicles_authenticated_update on public.vehicles;
drop policy if exists vehicles_authenticated_delete on public.vehicles;

create policy vehicles_authenticated_select on public.vehicles
for select to authenticated
using (true);

create policy vehicles_authenticated_insert on public.vehicles
for insert to authenticated
with check (true);

create policy vehicles_authenticated_update on public.vehicles
for update to authenticated
using (true)
with check (true);

create policy vehicles_authenticated_delete on public.vehicles
for delete to authenticated
using (true);

drop policy if exists attendance_public_select on public.attendance_entries;
drop policy if exists attendance_public_insert on public.attendance_entries;
drop policy if exists attendance_public_update on public.attendance_entries;
drop policy if exists attendance_authenticated_delete on public.attendance_entries;

create policy attendance_public_select on public.attendance_entries
for select to anon, authenticated
using (true);

create policy attendance_public_insert on public.attendance_entries
for insert to anon, authenticated
with check (true);

create policy attendance_public_update on public.attendance_entries
for update to anon, authenticated
using (true)
with check (true);

create policy attendance_authenticated_delete on public.attendance_entries
for delete to authenticated
using (true);

drop policy if exists employees_authenticated_select on public.employees;
drop policy if exists employees_authenticated_insert on public.employees;
drop policy if exists employees_authenticated_update on public.employees;
drop policy if exists employees_authenticated_delete on public.employees;

create policy employees_authenticated_select on public.employees
for select to authenticated
using (true);

create policy employees_authenticated_insert on public.employees
for insert to authenticated
with check (true);

create policy employees_authenticated_update on public.employees
for update to authenticated
using (true)
with check (true);

create policy employees_authenticated_delete on public.employees
for delete to authenticated
using (true);

drop policy if exists payroll_admin_select on public.payroll_closures;
drop policy if exists payroll_admin_insert on public.payroll_closures;
drop policy if exists payroll_admin_update on public.payroll_closures;
drop policy if exists payroll_admin_delete on public.payroll_closures;

create policy payroll_admin_select on public.payroll_closures
for select to authenticated
using (public.is_admin());

create policy payroll_admin_insert on public.payroll_closures
for insert to authenticated
with check (public.is_admin());

create policy payroll_admin_update on public.payroll_closures
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy payroll_admin_delete on public.payroll_closures
for delete to authenticated
using (public.is_admin());

drop policy if exists stores_public_select on public.stores;
drop policy if exists stores_admin_insert on public.stores;
drop policy if exists stores_admin_update on public.stores;
drop policy if exists stores_admin_delete on public.stores;

create policy stores_public_select on public.stores
for select to anon, authenticated
using (true);

create policy stores_admin_insert on public.stores
for insert to authenticated
with check (public.is_admin());

create policy stores_admin_update on public.stores
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy stores_admin_delete on public.stores
for delete to authenticated
using (public.is_admin());

drop policy if exists app_users_public_select on public.app_users;
drop policy if exists app_users_admin_insert on public.app_users;
drop policy if exists app_users_admin_update on public.app_users;
drop policy if exists app_users_admin_delete on public.app_users;

create policy app_users_public_select on public.app_users
for select to anon, authenticated
using (true);

create policy app_users_admin_insert on public.app_users
for insert to authenticated
with check (public.is_admin());

create policy app_users_admin_update on public.app_users
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy app_users_admin_delete on public.app_users
for delete to authenticated
using (public.is_admin());
