-- The Wiki has exactly one administrator. Authentication may create normal
-- Supabase users for other Google accounts, but RLS never grants them admin access.
delete from public.admin_users;
delete from public.admin_emails
where email <> 'hovietanh147@gmail.com';

insert into public.admin_emails (email, display_name)
values ('hovietanh147@gmail.com', 'AndyAnh174')
on conflict (email) do update
set display_name = excluded.display_name;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
    = 'hovietanh147@gmail.com';
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

comment on function public.is_admin() is
  'Returns true only for the verified Google/Supabase session of hovietanh147@gmail.com.';
