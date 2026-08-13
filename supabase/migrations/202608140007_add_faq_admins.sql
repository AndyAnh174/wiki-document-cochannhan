insert into public.admin_emails (email, display_name)
values
  ('damt35187@gmail.com', 'damt35187'),
  ('mikasaber2000@gmail.com', 'mikasaber2000')
on conflict (email) do update
set display_name = excluded.display_name;
