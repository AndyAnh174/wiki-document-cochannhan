alter table public.catalog_entries
drop constraint if exists catalog_entries_kind_check;

alter table public.catalog_entries
add constraint catalog_entries_kind_check
check (kind in ('gu', 'materials', 'killer-moves', 'equipment', 'effects', 'creatures'));
