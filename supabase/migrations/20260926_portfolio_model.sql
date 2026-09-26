-- The existing profile is the single public portfolio owned by each account.
-- Keeping its model here gives the dashboard and public page one source of truth.
alter table public.profiles
  add column if not exists selected_model text not null default 'white';

update public.profiles set selected_model = 'white'
where selected_model not in ('black', 'white', 'blue', 'red', 'orange', 'pink', 'lime', 'yellow', 'green', 'purple');

alter table public.profiles drop constraint if exists profiles_selected_model_check;
alter table public.profiles add constraint profiles_selected_model_check
  check (selected_model in ('black', 'white', 'blue', 'red', 'orange', 'pink', 'lime', 'yellow', 'green', 'purple'));
