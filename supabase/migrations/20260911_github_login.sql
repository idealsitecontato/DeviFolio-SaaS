-- Identidades usadas exclusivamente para entrar no Devifolio com a GitHub App.
create table if not exists public.github_login_identities (
  github_user_id text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  github_username text not null,
  email text not null,
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.github_login_identities enable row level security;
revoke all on table public.github_login_identities from public, anon, authenticated;
grant select, insert, update, delete on table public.github_login_identities to service_role;

create or replace function public.find_auth_user_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.find_auth_user_by_email(text) from public, anon, authenticated;
grant execute on function public.find_auth_user_by_email(text) to service_role;
