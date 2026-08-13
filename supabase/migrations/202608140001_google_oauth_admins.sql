create table if not exists public.admin_emails (
  email text primary key,
  display_name text not null default 'Quản trị viên',
  created_at timestamptz not null default now(),
  constraint admin_emails_normalized check (email = lower(trim(email)))
);

alter table public.admin_emails enable row level security;

revoke all on table public.admin_emails from anon, authenticated;
grant all on table public.admin_emails to service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.admin_emails
      where email = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

comment on table public.admin_emails is
  'Normalized Google account email allowlist. Only service_role may manage membership.';
