create table if not exists public.stores (
  id text primary key,
  name text not null unique,
  address text not null default '',
  phone text not null default '',
  logo_key text not null default '',
  created_at text not null
);

alter table public.stores disable row level security;
