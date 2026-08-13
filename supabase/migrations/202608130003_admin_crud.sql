create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Quản trị viên',
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

grant select on public.admin_users to authenticated;
grant select, insert, update, delete on
  public.catalog_entries,
  public.catalog_entry_attributes,
  public.catalog_entry_sections,
  public.catalog_media,
  public.recipes,
  public.recipe_outputs,
  public.recipe_components,
  public.catalog_entry_relations,
  public.killer_move_slots,
  public.wiki_chapters
to authenticated;
grant select on public.content_import_runs to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "Admins can read own role" on public.admin_users;
create policy "Admins can read own role"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins manage catalog entries" on public.catalog_entries;
create policy "Admins manage catalog entries"
on public.catalog_entries for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage catalog attributes" on public.catalog_entry_attributes;
create policy "Admins manage catalog attributes"
on public.catalog_entry_attributes for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage catalog sections" on public.catalog_entry_sections;
create policy "Admins manage catalog sections"
on public.catalog_entry_sections for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage catalog media" on public.catalog_media;
create policy "Admins manage catalog media"
on public.catalog_media for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage recipes" on public.recipes;
create policy "Admins manage recipes"
on public.recipes for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage recipe outputs" on public.recipe_outputs;
create policy "Admins manage recipe outputs"
on public.recipe_outputs for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage recipe components" on public.recipe_components;
create policy "Admins manage recipe components"
on public.recipe_components for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage catalog relations" on public.catalog_entry_relations;
create policy "Admins manage catalog relations"
on public.catalog_entry_relations for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage killer move slots" on public.killer_move_slots;
create policy "Admins manage killer move slots"
on public.killer_move_slots for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage wiki chapters" on public.wiki_chapters;
create policy "Admins manage wiki chapters"
on public.wiki_chapters for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins read import history" on public.content_import_runs;
create policy "Admins read import history"
on public.content_import_runs for select to authenticated
using ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wiki-assets',
  'wiki-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads wiki assets" on storage.objects;
create policy "Public reads wiki assets"
on storage.objects for select to anon, authenticated
using (bucket_id = 'wiki-assets');

drop policy if exists "Admins upload wiki assets" on storage.objects;
create policy "Admins upload wiki assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'wiki-assets' and (select public.is_admin()));

drop policy if exists "Admins update wiki assets" on storage.objects;
create policy "Admins update wiki assets"
on storage.objects for update to authenticated
using (bucket_id = 'wiki-assets' and (select public.is_admin()))
with check (bucket_id = 'wiki-assets' and (select public.is_admin()));

drop policy if exists "Admins delete wiki assets" on storage.objects;
create policy "Admins delete wiki assets"
on storage.objects for delete to authenticated
using (bucket_id = 'wiki-assets' and (select public.is_admin()));

comment on table public.admin_users is
  'Explicit allowlist for wiki administrators. Membership is managed only with service_role.';
