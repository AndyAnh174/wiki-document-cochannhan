-- Keep the current single-admin policy while allowing explicitly approved
-- administrators to be added later without rewriting the RLS function.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_emails
    where email = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

comment on function public.is_admin() is
  'Checks the normalized Google email against the service-role-managed admin allowlist.';
