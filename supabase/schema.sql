create table if not exists public.vehicles (
  id text primary key,
  date text not null,
  store text not null,
  stock text not null,
  make text not null,
  model text not null,
  vin text not null default '',
  sales_person text not null,
  time text not null,
  pickup_time text not null default '',
  delivered_time text not null default '',
  simo text not null default '',
  comments text not null default '',
  price double precision not null default 0,
  status text not null,
  created_at text not null,
  updated_at text not null,
  updated_by text not null,
  history jsonb not null default '[]'::jsonb
);

create table if not exists public.attendance_entries (
  id text primary key,
  employee_code text not null,
  employee_name text not null,
  role text not null,
  store text not null,
  date text not null,
  clock_in text not null,
  clock_out text,
  notes text not null default ''
);

create table if not exists public.employees (
  id text primary key,
  employee_code text not null,
  employee_name text not null,
  role text not null,
  store text not null,
  active boolean not null default true,
  created_at text not null
);

create table if not exists public.app_users (
  id text primary key,
  auth_user_id uuid unique,
  full_name text not null,
  email text not null unique,
  employee_code text not null,
  store text not null,
  job_title text not null,
  role text not null,
  is_blocked boolean not null default false,
  blocked_at text,
  created_at text not null
);

alter table public.vehicles disable row level security;
alter table public.attendance_entries disable row level security;
alter table public.employees disable row level security;
alter table public.app_users disable row level security;
