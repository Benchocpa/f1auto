alter table public.app_users
add column if not exists is_blocked boolean not null default false;

alter table public.app_users
add column if not exists blocked_at text;
