create table if not exists public.payroll_closures (
  id text primary key,
  store text not null,
  closed_at text not null,
  closed_by text not null
);

alter table public.payroll_closures disable row level security;
