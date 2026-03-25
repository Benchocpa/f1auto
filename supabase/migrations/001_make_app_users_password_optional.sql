alter table public.app_users
  alter column password drop not null;

alter table public.app_users
  alter column password drop default;
